import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generateAll, LENGTHS, CHARSET_LEN, REJECT_THRESHOLD, isValidPassword, generateComplexPassword } from "../src/password";

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
    for (const len of [0, 1, 10, 23, 27, 50]) {
      expect(generatePassword(len)).toHaveLength(len);
    }
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

  it("only contains characters from the provided categories", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 20;
    const pw = generateComplexPassword(length, categories);
    const allowedChars = new Set([...categories.flat().join('')]);
    expect([...pw].every(char => allowedChars.has(char))).toBe(true);
  });

  it("returns a string of the requested length when length equals number of categories", () => {
    const categories = [["abc"], ["123"], ["!@#"]];
    const length = 3;
    const pw = generateComplexPassword(length, categories);
    expect(pw).toHaveLength(length);
    const chars = [...pw];
    const matched = new Array(categories.length).fill(false);
    for (const char of chars) {
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].join('').includes(char)) {
          matched[i] = true;
          break;
        }
      }
    }
    expect(matched).toEqual([true, true, true]);
  });

  it("returns an empty string if length is zero or negative", () => {
    expect(generatePasswordWithCharset(0, "abc")).toBe("");
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
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
    expect(() => generatePassword(65537)).toThrow(`Length exceeds maximum allowed: 65536`);
  });

  it("handles edge cases for generatePasswordWithCharset", () => {
    expect(generatePasswordWithCharset(0, "abc")).toBe("");
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
    expect(generatePasswordWithCharset(10, "")).toBe("");
    expect(generatePasswordWithCharset(10, undefined as any)).toBe("");
  });
});

describe("isValidPassword", () => {
  it("validates passwords against charsets", () => {
    expect(isValidPassword("abc123", "abc123")).toBe(true);
    expect(isValidPassword("abc123", "abc")).toBe(false);
    expect(isValidPassword("", "abc")).toBe(true);
    expect(isValidPassword("!", "!")).toBe(true);
    expect(isValidPassword(" ", " ")).toBe(true);
  });
});