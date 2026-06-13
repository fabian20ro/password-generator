import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generateAll, LENGTHS, CHARSET_LEN, REJECT_THRESHOLD, isValidPassword, generateComplexPassword, MAX_LENGTH, CHARS, SYMBOLS } from "../src/password";
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
    for (const len of [0, 1, 10, 23, 25, 26, 27, 28, 29, 30, 31, 32, 65536, 70000]) {
      if (len > MAX_LENGTH) {
        expect(() => generatePassword(len)).toThrow();
      } else {
        expect(generatePassword(len)).toHaveLength(len);
      }
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
      expect(pw).toMatch(/^[A-Za-z0-9]+$/);
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

  it("handles charsets with duplicate characters", () => {
    const length = 10;
    const pw = generatePasswordWithCharset(length, "aabb");
    expect(pw).toHaveLength(length);
    expect(pw).toMatch(/^[ab]+$/);
  });

  it("handles unicode characters in charset", () => {
    const length = 10;
    const pw = generatePasswordWithCharset(length, "🚀✨");
    expect([...pw].length).toBe(length);
    expect(pw).toMatch(/^[🚀✨]+$/);
  });

  it("handles empty categories in generateComplexPassword by returning empty string", () => {
    const categories = [['A', 'B'], []];
    const pw = generateComplexPassword(10, categories);
    expect(pw).toBe("");
  });

  it("only contains letters when using generatePasswordWithLettersOnly", () => {
    const length = 20;
    const pw = generatePasswordWithLettersOnly(length);
    expect(pw).toHaveLength(length);
    expect(pw).toMatch(/^[A-Za-z]+$/);
  });

  it("only contains the specified symbols when using generatePasswordWithSymbols", () => {
    const length = 20;
    const pw = generatePasswordWithSymbols(length);
    const allowedChars = new Set([...CHARS, ...SYMBOLS]);
    expect(pw).toHaveLength(length);
    expect([...pw].every(char => allowedChars.has(char))).toBe(true);
  });

  it("throws error for lengths greater than MAX_LENGTH", () => {
    expect(() => generatePasswordWithCharset(MAX_LENGTH + 1, "abc")).toThrow(`Length exceeds maximum allowed: ${MAX_LENGTH}`);
  });

  it("returns an empty string if any category is empty", () => {
    const categories = [["abc"], []];
    const length = 10;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });

  it("returns an empty string if length is less than number of categories", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 2;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toBe("");
  });

  it("handles emoji in generatePasswordWithCharset", () => {
    const pw = generatePasswordWithCharset(5, "😀abc");
    expect([...pw].length).toBe(5);
    expect([...pw].every(char => "😀abc".includes(char))).toBe(true);
  });

  it("handles large number of categories", () => {
    const categories = Array.from({ length: 10 }, (_, i) => [`a${i}`, `b${i}`, `c${i}`]);
    const length = 20;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    for (const category of categories) {
      const categoryChars = [...category.join('')];
      expect([...pw].some(char => categoryChars.includes(char))).toBe(true);
    }
  });

  it("throws error if length exceeds MAX_LENGTH in generatePasswordWithLettersOnly", () => {
    expect(() => generatePasswordWithLettersOnly(65537)).toThrow(/Length exceeds maximum allowed/);
  });

  it("returns an empty string if length is zero or negative", () => {
    expect(generatePasswordWithCharset(0, "abc")).toBe("");
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
  });

  it("returns an empty string for an empty charset", () => {
    expect(generatePasswordWithCharset(10, "")).toBe("");
  });

  it("validates password characters against a charset", () => {
    const charset = "abc123";
    expect(isValidPassword("a1b2c3", charset)).toBe(true);
    expect(isValidPassword("a1b2c!", charset)).toBe(false);
    expect(isValidPassword("", charset)).toBe(true);
    expect(isValidPassword("abc", "def")).toBe(false);
    expect(isValidPassword("😀", "😀")).toBe(true);
    expect(isValidPassword("😀", "a")).toBe(false);
  });

  it("returns a string with symbols", () => {
    const pw = generatePasswordWithSymbols(20);
    expect(pw).toHaveLength(20);
    expect(pw).toMatch(/[!@#$%^&*()\-=_+[\]{}|;:,.<>?]/);
  });

  it("returns a string with letters only", () => {
    const pw = generatePasswordWithLettersOnly(20);
    expect(pw).toHaveLength(20);
    expect(pw).toMatch(/^[A-Za-z]+$/);
  });

  it("generates all passwords of standard lengths", () => {
    const passwords = generateAll();
    expect(passwords).toHaveLength(LENGTHS.length);
    for (const pw of passwords) {
      expect(pw).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it("throws error if length exceeds MAX_LENGTH", () => {
    expect(() => generatePassword(65537)).toThrow(/Length exceeds maximum allowed/);
  });
});

describe("getSecureRandomInt", () => {
  it("returns a number in the range [0, max)", () => {
    const max = 10;
    for (let i = 0; i < 100; i++) {
      const val = getSecureRandomInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
    }
  });

  it("returns 0 when max is 1", () => {
    for (let i = 0; i < 100; i++) {
      const val = getSecureRandomInt(1);
      expect(val).toBe(0);
    }
  });

  it("throws error for non-positive max", () => {
    expect(() => getSecureRandomInt(0)).toThrow("Max must be positive");
    expect(() => getSecureRandomInt(-1)).toThrow("Max must be positive");
  });
});
