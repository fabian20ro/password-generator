import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generatePasswordWithNumbersOnly, generateAll, LENGTHS, CHARSET_LEN, REJECT_THRESHOLD, isValidPassword, generateComplexPassword, MAX_LENGTH, CHARS, SYMBOLS } from "../src/password";
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
    for (const len of [0, 1, 10, 23, 25, 26, 27, 28, 29, 30, 31, 32, 65566]) {
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

  it("handles duplicate characters in categories", () => {
    const categories = [["aa"], ["bb"]];
    const length = 4;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    expect([...pw].every(char => char === 'a' || char === 'b')).toBe(true);
  });

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
    expect(() => generatePasswordWithLettersOnly(MAX_LENGTH + 1)).toThrow(/Length exceeds maximum allowed/);
    expect(() => generateComplexPassword(MAX_LENGTH + 1, [["a"]])).toThrow(/Length exceeds maximum allowed/);
  });

  it("handles edge case length: MAX_LENGTH for generateComplexPassword", () => {
    const categories = [["a"], ["1"], ["!"]];
    const length = MAX_LENGTH;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
  });

  it("handles empty charsets in generatePasswordWithCharset", () => {
    expect(generatePasswordWithCharset(10, "")).toBe("");
  });

  it("returns an empty string if length is zero or negative", () => {
    expect(generatePasswordWithCharset(0, "abc")).toBe("");
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
  });

  it("verifies complex passwords for character set compliance", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 20;
    const pw = generateComplexPassword(length, categories);
    const fullCharset = CHARS + SYMBOLS;
    expect(isValidPassword(pw, fullCharset)).toBe(true);
  });

  it("verifies isValidPassword with various inputs", () => {
    expect(isValidPassword("abc123", "abc123")).toBe(true);
    expect(isValidPassword("abc123", "abc")).toBe(false);
    expect(isValidPassword("", "abc")).toBe(false);
    expect(isValidPassword("abc", "")).toBe(false);
  });
});
