import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePassword, generateAll, LENGTHS, REJECT_THRESHOLD } from "../src/password";

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

describe("rejection sampling", () => {
  it("rejects biased values and resamples", () => {
    const getCallCount = installCryptoMock([4294967295, 42]);
    const pw = generatePassword(1);

    expect(pw).toHaveLength(1);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
    expect(getCallCount()).toBe(2);
  });

  it("handles the exact REJECT_THRESHOLD boundary", () => {
    // When val is exactly REJECT_THRESHOLD, it should trigger resampling
    const getCallCount = installCryptoMock([REJECT_THRESHOLD, 42]);
    const pw = generatePassword(1);
    expect(getCallCount()).toBe(2);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
  });
});
