import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generatePasswordWithNumbersOnly, generateAll, LENGTHS, CHARSET_LEN, isValidPassword, generateComplexPassword, MAX_LENGTH, CHARS, SYMBOLS, generatePasswordAmbiguityFree } from "../src/password";
import { getSecureRandomInt } from "../src/crypto-utils";

const originalCrypto = globalThis.crypto;

function installCryptoMock(sequence: number[] = []): () => number {
  const values = [...sequence];
  let callCount = 0;
  
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    writable: true,
    value: {
      getRandomValues<T extends ArrayBufferView | null>(array: T): T {
        callCount++;
        if (array instanceof Uint32Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = values.length > 0 ? (values.shift() as number) : Math.floor(Math.random() * 42967296);
          }
        }
        return array;
      },
    },
  });
  
  return () => callCount;
}

function restoreCryptoMock(): void {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    writable: true,
    value: originalCrypto,
  });
}

beforeEach(() => {
  installCryptoMock();
});

afterEach(() => {
  restoreCryptoMock();
});

describe("generatePassword", () => {
  it("returns a string of the requested length", () => {
    for (const len of [1, 10, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]) {
      expect(generatePassword(len)).toHaveLength(len);
    }
  });

  it("returns an empty string for non-integer lengths", () => {
    expect(generatePassword(2.5)).toBe("");
  });

  it("returns an empty string for non-positive integer lengths", () => {
    expect(generatePassword(0)).toBe("");
    expect(generatePassword(-1)).toBe("");
  });

  it("returns an empty string for non-integer lengths in generatePasswordWithCharset", () => {
    expect(generatePasswordWithCharset(2.5, "abc")).toBe("");
    expect(generatePasswordWithCharset(10, "")).toBe("");
  });

  it("returns an empty string for non-integer lengths in generateComplexPassword", () => {
    expect(generateComplexPassword(2.5, [["abc"]])).toBe("");
  });

  it("only contains alphanumeric characters", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword(27);
      expect(pw).toMatch(/^[A-Za-z0123456789]+$/);
    }
  });

  it("returns an array of passwords of all defined lengths", () => {
    const passwords = generateAll();
    expect(passwords).toHaveLength(LENGTHS.length);
    for (const len of LENGTHS) {
      expect(passwords.filter(p => p.length === len)).toHaveLength(1);
    }
  });

  it("generates multiple copies per slot when count > 1", () => {
    const passwords = generateAll(3);
    expect(passwords).toHaveLength(LENGTHS.length * 3);
    for (const len of LENGTHS) {
      expect(passwords.filter(p => p.length === len)).toHaveLength(3);
    }
  });

  it("produces different passwords when count > 1", () => {
    const passwords = generateAll(5);
    // Group by length and verify each group has unique entries
    for (const len of LENGTHS) {
      const group = passwords.filter(p => p.length === len);
      expect(new Set(group).size).toBe(group.length);
    }
  });

  it("returns empty array for non-positive count", () => {
    expect(generateAll(0)).toEqual([]);
    expect(generateAll(-1)).toEqual([]);
  });

  it("returns empty array for non-integer count", () => {
    expect(generateAll(2.5)).toEqual([]);
  });

  it("enforces minClassesPerPassword=3 to require all three character classes", () => {
    const passwords = generateAll(1, { minClassesPerPassword: 3 });
    for (const pw of passwords) {
      const hasUpper = /[A-Z]/.test(pw);
      const hasLower = /[a-z]/.test(pw);
      const hasDigit = /[0-9]/.test(pw);
      expect(hasUpper && hasLower && hasDigit).toBe(true);
    }
  });
  it("returns a string of the requested length and contains characters from all categories", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    for (const category of categories) {
      const categoryChars = [...category.join('')];
      expect([...pw].some(char => categoryChars.includes(char))).toBe(true);
    }
  });

  it("works when length is exactly the number of categories", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = categories.length;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    for (const category of categories) {
      const categoryChars = [...category.join('')];
      expect([...pw].some(char => categoryChars.includes(char))).toBe(true);
    }
  });

  it("handles charsets with a single character", () => {
    const length = 10;
    const pw = generatePasswordWithCharset(length, "a");
    expect(pw).toHaveLength(length);
    expect(pw).toBe("aaaaaaaaaa");
  });

  it("produces only characters from the provided custom charset (hex)", () => {
    // Custom hex-only charset — verify output is strictly limited to those chars
    const hexCharset = "0123456789abcdef";
    for (let i = 0; i < 100; i++) {
      const pw = generatePasswordWithCharset(16, hexCharset);
      expect(pw).toHaveLength(16);
      expect([...pw].every(c => hexCharset.includes(c))).toBe(true);
    }
  });

  it("handles length up to MAX_LENGTH", () => {
    const length = 65536;
    const pw = generatePasswordWithCharset(length, "abc");
    expect(pw).toHaveLength(length);
  });

  it("handles length up to MAX_LENGTH in generateComplexPassword", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 65536;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    expect(isValidPassword(pw, CHARS + SYMBOLS)).toBe(true);
  });

  it("throws error for lengths greater than MAX_LENGTH", () => {
    expect(() => generatePassword(MAX_LENGTH + 1)).toThrow();
  });

  it("handles getSecureRandomInt with max=1", () => {
    const values = [0, 1];
    const callCount = installCryptoMock(values);
    const result = getSecureRandomInt(1);
    expect(result).toBe(0);
    expect(callCount()).toBe(1);
    restoreCryptoMock();
  });

  it("throws error for non-positive max in getSecureRandomInt", () => {
    expect(() => getSecureRandomInt(0)).toThrow("Max must be between 1 and UINT32_MODULUS");
    expect(() => getSecureRandomInt(-1)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("handles very large max for getSecureRandomInt", () => {
    const max = 2**31;
    const val = getSecureRandomInt(max);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(max);
  });
});

describe("isValidPassword", () => {
  it("returns true for valid passwords", () => {
    expect(isValidPassword("abc123", CHARS)).toBe(true);
    expect(isValidPassword("abc!@#", CHARS + SYMBOLS)).toBe(true);
  });

  it("returns false for passwords with invalid characters", () => {
    expect(isValidPassword("abc!@#", CHARS)).toBe(false);
    expect(isValidPassword("abc123", SYMBOLS)).toBe(false);
  });

  it("returns false for empty passwords", () => {
    expect(isValidPassword("", CHARS)).toBe(false);
  });
});

describe("generatePasswordWithSymbols", () => {
  it("only contains characters from CHARS and SYMBOLS", () => {
    const length = 20;
    const pw = generatePasswordWithSymbols(length);
    const allowedChars = new Set([...CHARS, ...SYMBOLS]);
    expect(pw).toHaveLength(length);
    expect([...pw].every(char => allowedChars.has(char))).toBe(true);
  });
});

describe("generatePasswordWithLettersOnly", () => {
  it("only contains letters", () => {
    const length = 20;
    const pw = generatePasswordWithLettersOnly(length);
    expect(pw).toHaveLength(length);
    expect(pw).toMatch(/^[A-Za-z]+$/);
  });
});

describe("generatePasswordWithNumbersOnly", () => {
  it("only contains numbers", () => {
    const length = 20;
    const pw = generatePasswordWithNumbersOnly(length);
    expect(pw).toHaveLength(length);
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it("only contains characters from the actual NUMBERS_ONLY_CHARSET (verified at runtime)", () => {
    // Verify charset compliance using source constants — mirrors the symbols test at line 182
    const numbersOnlyCharset = CHARS.substring(52);
    for (let i = 0; i < 200; i++) {
      const pw = generatePasswordWithNumbersOnly(32);
      expect(pw).toHaveLength(32);
      expect([...pw].every(c => numbersOnlyCharset.includes(c))).toBe(true);
    }
  });

  it("only contains letters", () => {
    const length = 20;
    const pw = generatePasswordWithLettersOnly(length);
    expect(pw).toHaveLength(length);
    expect(pw).toMatch(/^[A-Za-z]+$/);
  });

  it("only contains characters from the actual LETTERS_ONLY_CHARSET (verified at runtime)", () => {
    // Verify charset compliance using source constants — mirrors the symbols test at line 182
    const lettersOnlyCharset = CHARS.substring(0, 52);
    for (let i = 0; i < 200; i++) {
      const pw = generatePasswordWithLettersOnly(32);
      expect(pw).toHaveLength(32);
      expect([...pw].every(c => lettersOnlyCharset.includes(c))).toBe(true);
    }
  });
});

describe("generateComplexPassword", () => {
  it("returns a password when all categories are non-empty", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
  });

  it("returns an empty string if any category is empty", () => {
    const categories = [["a"], [""]];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });

  it("returns an empty string if length is less than categories.length", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = categories.length - 1;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });

  it("verifies complex passwords for character set compliance", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 20;
    const pw = generateComplexPassword(length, categories);
    const fullCharset = CHARS + SYMBOLS;
    expect(isValidPassword(pw, fullCharset)).toBe(true);
  });

  it("shuffle distributes category picks across all positions", () => {
    // With emoji-only categories, fillers draw from same set — every char is category-sourced
    const categories = [["🔤"], ["⚡"]];
    const length = 6;
    for (let i = 0; i < 500; i++) {
      const pw = generateComplexPassword(length, categories);
      // Use spread to count actual characters (emoji are multi-byte in UTF-16)
      expect([...pw].length).toBe(length);
      expect([...pw].includes("🔤")).toBe(true);
      expect([...pw].includes("⚡")).toBe(true);
    }
  });

  it("shuffle distributes character positions uniformly across samples", () => {
    // With emoji-only categories, every char is category-sourced — verify shuffle spreads them across all positions
    const categories = [["🔤"], ["⚡"]];
    const length = 6;
    const posCounts: Record<number, number> = {};
    for (let i = 0; i < 1000; i++) {
      const pw = generateComplexPassword(length, categories);
      // Track where "⚡" lands — verify it appears in all positions including the end
      for (let pos = 0; pos < length; pos++) {
        if (pw[pos] === "⚡") posCounts[pos] = (posCounts[pos] || 0) + 1;
      }
    }
    // Each position should see ⚡ in at least ~5% of samples
    for (let pos = 0; pos < length; pos++) {
      const ratio = (posCounts[pos] || 0) / 1000;
      expect(ratio).toBeGreaterThan(0.05);
      expect(ratio).toBeLessThan(0.95);
    }
  });

  it("shuffle distributes picks uniformly across positions", () => {
    // Use non-overlapping categories so we can definitively track where each category's pick lands after shuffle
    const categories = [["a"], ["b"]];
    const length = 6;
    // Track which character is at each position (only "a" or "b" appear initially)
    const aInPos: number[] = Array(length).fill(0);
    const bInPos: number[] = Array(length).fill(0);
    for (let i = 0; i < 3000; i++) {
      const pw = generateComplexPassword(length, categories);
      for (let pos = 0; pos < length; pos++) {
        if (pw[pos] === "a") aInPos[pos]++;
        else if (pw[pos] === "b") bInPos[pos]++;
      }
    }
    // Both category picks should appear across all positions (shuffle spreads them)
    for (let pos = 0; pos < length; pos++) {
      const aRatio = aInPos[pos] / 3000;
      const bRatio = bInPos[pos] / 3000;
      expect(aRatio).toBeGreaterThan(0.15);
      expect(bRatio).toBeGreaterThan(0.15);
    }
  });

  it("guarantees category coverage with overlapping character sets", () => {
    // Categories share characters — verify each category still contributes at least one pick per password
    const overlapCategory1 = "abcxyz";
    const overlapCategory2 = "cdeyza";
    const categories = [overlapCategory1.split(""), overlapCategory2.split("")];
    const length = 8;
    for (let i = 0; i < 500; i++) {
      const pw = generateComplexPassword(length, categories);
      expect([...pw].some(c => overlapCategory1.includes(c))).toBe(true);
      expect([...pw].some(c => overlapCategory2.includes(c))).toBe(true);
    }
  });

  it("handles identical-category sub-arrays without losing charset compliance", () => {
    // When user supplies duplicate charsets, each pick still draws from the shared set — verify output stays valid
    const idChar = "abc";
    const categories = Array(3).fill(idChar.split(""));
    const length = 10;
    for (let i = 0; i < 200; i++) {
      const pw = generateComplexPassword(length, categories);
      expect(pw).toHaveLength(length);
      expect(isValidPassword(pw, idChar)).toBe(true);
    }
  });

  it("returns an empty string when all category sub-arrays are empty", () => {
    const categories: string[][] = [[], [], []];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });
});

describe("generatePasswordAmbiguityFree", () => {
  it("returns a password of correct length without ambiguous characters", () => {
    const length = 20;
    for (let i = 0; i < 50; i++) {
      const pw = generatePasswordAmbiguityFree(length);
      expect(pw).toHaveLength(length);
      // Verify no ambiguous chars: 0, O, l, I, 1
      expect([...pw].every(c => !["0", "O", "l", "I", "1"].includes(c))).toBe(true);
    }
  });

  it("returns an empty string for non-positive length", () => {
    expect(generatePasswordAmbiguityFree(0)).toBe("");
    expect(generatePasswordAmbiguityFree(-5)).toBe("");
  });

  it("returns an empty string for non-integer length", () => {
    expect(generatePasswordAmbiguityFree(2.5)).toBe("");
  });
});
