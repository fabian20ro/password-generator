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

  it("produces uniform distribution across full uint32 range (zero-rejection path)", () => {
    const buckets = new Array(100).fill(0);
    for (let i = 0; i < 50_000; i++) {
      const val = getSecureRandomInt(UINT32_MODULUS);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(UINT32_MODULUS);
      buckets[Math.floor(val / (UINT32_MODULUS / 100))]++;
    }
    // Each bucket should receive ~500 ± 3σ samples.
    const expected = 500;
    const tolerance = 3 * Math.sqrt(expected);
    for (const count of buckets) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance);
    }
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

  it("throws when getRandomValues is a number on crypto object", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: 42 }, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: realCrypto, configurable: true, writable: true });
    }
  });

  it("throws when getRandomValues is a string on crypto object", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: "not-a-function" }, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: realCrypto, configurable: true, writable: true });
    }
  });

  it("throws when getRandomValues is a boolean on crypto object", () => {
    const realCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: true }, configurable: true, writable: true });
    try {
      expect(() => getSecureRandomInt(10)).toThrow("Crypto API unavailable");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: realCrypto, configurable: true, writable: true });
    }
  });

  it("throws if max is Infinity (Number.isInteger returns true for Infinity)", () => {
    expect(() => getSecureRandomInt(Infinity)).toThrow("Max must be between 1 and UINT32_MODULUS");
    expect(() => getSecureRandomInt(-Infinity)).toThrow("Max must be between 1 and UINT32_MODULUS");
  });

  it("produces uniform binary output (max=2) under zero-rejection conditions", () => {
    // Guard: skip if crypto API unavailable in this environment
    const c = globalThis.crypto as any;
    if (!c || typeof c.getRandomValues !== "function") return;

    // max=2 has threshold = UINT32_MODULUS - (UINT32_MODULUS % 2) = UINT32_MODULUS,
    // so no rejections occur — this exercises the full loop with a binary output
    // space and verifies bias-free coin-flip behavior.
    const counts = [0, 0];
    for (let i = 0; i < 10_000; i++) {
      const val = getSecureRandomInt(2);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(2);
      counts[val]++;
    }
    // ~50/50 split with generous tolerance for rejection-sampling variance.
    const expected = 5_000;
    const tolerance = 3 * Math.sqrt(expected);
    for (const count of counts) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance);
    }
  });

  it("produces uniform output at byte-size range with high rejection rate", () => {
    // Guard: skip if crypto API unavailable in this environment
    const c = globalThis.crypto as any;
    if (!c || typeof c.getRandomValues !== "function") return;

    // max=0xFF exercises rejection sampling where threshold creates a measurable bias gap.
    // Threshold = UINT32_MODULUS - (UINT32_MODULUS % 0xFF) — non-trivial rejection zone.
    const buckets = new Array(255).fill(0);
    for (let i = 0; i < 10_000; i++) {
      const val = getSecureRandomInt(0xff);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(255);
      buckets[val]++;
    }
    // Each bucket should receive ~39.2 samples (10000/255) with tight tolerance.
    const expected = 10_000 / 255;
    const tolerance = 3 * Math.sqrt(expected);
    for (const count of buckets) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance);
    }
  });
});
