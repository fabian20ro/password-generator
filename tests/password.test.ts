import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generatePasswordWithCharset, generatePasswordWithSymbols, generatePasswordWithLettersOnly, generateAll, LENGTHS, CHARSET_LEN, REJECT_THRESHOLD, isValidPassword } from "../src/password";

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

  it("generates different passwords on successive calls", () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword(25)));
    expect(passwords.size).toBeGreaterThan(1);
  });
});

describe("generatePasswordWithCharset", () => {
  it("returns a string of the requested length", () => {
    for (const len of [0, 1, 10]) {
      expect(generatePasswordWithCharset(len, "abc")).toHaveLength(len);
    }
  });

  it("returns an empty string for negative lengths", () => {
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
  });

  it("returns an empty string for non-integer lengths", () => {
    for (const len of [NaN, 2.5, Infinity]) {
      expect(generatePasswordWithCharset(len, "abc")).toBe("");
    }
  });

  it("does not sample crypto for invalid lengths or an empty charset", () => {
    const getCallCount = installCryptoMock();

    expect(generatePasswordWithCharset(0, "abc")).toBe("");
    expect(generatePasswordWithCharset(-1, "abc")).toBe("");
    expect(generatePasswordWithCharset(10, "")).toBe("");

    expect(getCallCount()).toBe(0);
  });

  it("validates passwords against a charset", () => {
    const charset = "ABC123";
    expect(isValidPassword("A1", charset)).toBe(true);
    expect(isValidPassword("A!1", charset)).toBe(false);
    expect(isValidPassword("", charset)).toBe(true);
  });

  it("correctly applies rejection sampling for custom charset", () => {
    const getCallCount = installCryptoMock([4294967295, 42]);
    const pw = generatePasswordWithCharset(1, "012");

    expect(getCallCount()).toBe(2);
    expect(pw).toMatch(/^[012]$/);
  });

  it("throws an error for lengths greater than 65536", () => {
    expect(() => generatePasswordWithCharset(65537, "abc")).toThrow(/Length exceeds maximum allowed/);
  });
});

describe("generatePasswordWithSymbols", () => {
  it("returns a string of the requested length", () => {
    for (const len of [5, 10, 20]) {
      expect(generatePasswordWithSymbols(len)).toHaveLength(len);
    }
  });

  it("contains only valid alphanumeric and symbol characters", () => {
    const regex = new RegExp(`^[A-Za-z0-9!@#$%^&*()\\-_=+[\\]{}|;:,.<>?]+$`);
    for (let i = 0; i < 20; i++) {
      const pw = generatePasswordWithSymbols(50);
      expect(pw).toMatch(regex);
    }
  });
});

describe("generatePasswordWithLettersOnly", () => {
  it("returns a string of the requested length", () => {
    for (const len of [5, 10, 20]) {
      expect(generatePasswordWithLettersOnly(len)).toHaveLength(len);
    }
  });

  it("only contains letters", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePasswordWithLettersOnly(27);
      expect(pw).toMatch(/^[A-Za-z]+$/);
    }
  });
});

describe("generateAll", () => {
  it("returns exactly 10 passwords", () => {
    expect(generateAll()).toHaveLength(10);
  });

  it("returns passwords with lengths 23 through 32", () => {
    const passwords = generateAll();
    const lengths = passwords.map((pw) => pw.length);
    expect(lengths).toEqual([...LENGTHS]);
  });

  it("returns only alphanumeric characters in all passwords", () => {
    for (const pw of generateAll()) {
      expect(pw).toMatch(/^[A-Za-z0-9]+$/);
    }
  });
});

describe("LENGTHS", () => {
  it("contains exactly [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]", () => {
    expect([...LENGTHS]).toEqual([23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);
  });
});

describe("threshold constants", () => {
  it("derives the rejection threshold from the 32-bit modulus and charset length", () => {
    const modulus = 0x1_0000_0000;
    expect(REJECT_THRESHOLD).toBe(modulus - (modulus % CHARSET_LEN));
  });
});

describe("rejection sampling", () => {
  it("rejects biased values and resamples", () => {
    const getCallCount = installCryptoMock([4294967295, 42]);
    const pw = generatePassword(1);

    expect(pw).toHaveLength(1);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
    expect(getCallCount()).toBe(2);
  });

  it("handles the exact REJECT_THRESHOLD boundary", () => {
    const getCallCount = installCryptoMock([REJECT_THRESHOLD, 42]);
    const pw = generatePassword(1);

    expect(pw).toHaveLength(1);
    expect(getCallCount()).toBe(2);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
  });

  it("does not resample when val is just below REJECT_THRESHOLD", () => {
    const getCallCount = installCryptoMock([REJECT_THRESHOLD - 1]);
    const pw = generatePassword(1);

    expect(pw).toHaveLength(1);
    expect(getCallCount()).toBe(1);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
  });
});

describe("Unicode support", () => {
  it("generates passwords with emojis", () => {
    const charset = "😀😎🚀";
    for (let i = 0; i < 20; i++) {
      const pw = generatePasswordWithCharset(10, charset);
      expect([...pw].length).toBe(10);
      expect(pw).toMatch(/^[😀😎🚀]+$/);
    }
  });

  it("validates passwords with emojis correctly", () => {
    const charset = "😀😎🚀";
    expect(isValidPassword("😀😎🚀", charset)).toBe(true);
    expect(isValidPassword("😀😎", charset)).toBe(true);
    expect(isValidPassword("😀", charset)).toBe(true);
    expect(isValidPassword("😎🚀", charset)).toBe(true);
    expect(isValidPassword("😀😎🚀!", charset)).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("returns true for valid passwords", () => {
    expect(isValidPassword("abc", "abcd")).toBe(true);
    expect(isValidPassword("123", "0123456789")).toBe(true);
    expect(isValidPassword("😀😎", "😀😎ABC")).toBe(true);
  });

  it("returns false for invalid passwords", () => {
    expect(isValidPassword("abcde", "abcd")).toBe(false);
    expect(isValidPassword("12a", "123")).toBe(false);
    expect(isValidPassword("😀", "abc")).toBe(false);
  });
});
