import { describe, it, expect } from "vitest";
import { getSecureRandomInt, UINT32_MODULUS } from "../src/crypto-utils";

describe("getSecureRandomInt", () => {
  it("throws error if max is <= 0", () => {
    expect(() => getSecureRandomInt(0)).toThrow("Max must be between 1 and UINT32_MODULUS");
    expect(() => getSecureRandomInt(-1)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("returns a value in [0, max)", () => {
    const max = 100;
    for (let i = 0; i < 100; i++) {
      const val = getSecureRandomInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
    }
  });

  it("handles large max values correctly", () => {
    const max = 0x1_000_000_00;
    const val = getSecureRandomInt(max);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(max);
  });

  it("handles max=1 correctly", () => {
    const val = getSecureRandomInt(1);
    expect(val).toBe(0);
  });

  it("throws if max exceeds UINT32_MODULUS", () => {
    expect(() => getSecureRandomInt(UINT32_MODULUS + 1)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("throws if max is non-integer (fractional)", () => {
    expect(() => getSecureRandomInt(5.5)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("handles max=UINT32_MODULUS correctly (zero-rejection degenerate case)", () => {
    const val = getSecureRandomInt(UINT32_MODULUS);
    expect(val).toBeGreaterThanOrEqual(0);
    // When max == UINT32_MODULUS, threshold == UINT32_MODULUS so no rejection;
    // return is the raw uint32 value — verify it fits in uint32 range.
    expect(val).toBeLessThan(UINT32_MODULUS);
  });

  it("produces approximately uniform distribution", () => {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 5000; i++) {
      const val = getSecureRandomInt(10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
      buckets[val]++;
    }
    // Each bucket should receive ~500 ± 3σ samples (binomial tolerance).
    const expected = 500;
    const tolerance = 3 * Math.sqrt(expected);
    for (const count of buckets) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance);
    }
  });

  it("throws if max is NaN (non-numeric)", () => {
    expect(() => getSecureRandomInt(NaN)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("throws when Crypto API is unavailable (crypto missing)", () => {
    Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      // Restore original crypto — vitest expects it for other tests in suite
      const orig = globalThis.crypto;
      Object.defineProperty(globalThis, "crypto", { value: orig, configurable: true, writable: true });
    }
  });

  it("throws when getRandomValues is missing from crypto", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: realCrypto, configurable: true, writable: true });
    }
  });

  it("throws when getRandomValues is not a function on crypto object", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: null }, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: realCrypto, configurable: true, writable: true });
    }
  });
});
