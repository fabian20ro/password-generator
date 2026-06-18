import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generatePasswordWithNumbersOnly, generateAll, LENGTHS, CHARSET_LEN, isValidPassword, generateComplexPassword, MAX_LENGTH, CHARS, SYMBOLS } from "../src/password";
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
            array[i] = values.length > 0 ? (values.shift() as number) : Math.floor(Math.random() * 4294967296);
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

  it("handles length up to MAX_LENGTH", () => {
    const length = 65536;
    const pw = generatePasswordWithCharset(length, "abc");
    expect(pw).toHaveLength(length);
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
    expect(() => getSecureRandomInt(0)).toThrow("Max must be positive");
    expect(() => getSecureRandomInt(-1)).toThrow("Max must be positive");
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
});

describe("generateComplexPassword", () => {
  it("handles empty categories in generateComplexPassword by returning empty string", () => {
    const categories = [['a', 'b'], []];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });

  it("handles empty categories in generateComplexPassword by returning empty string", () => {
    const categories = [["a"], [""]];
    const length = 10;
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
});
