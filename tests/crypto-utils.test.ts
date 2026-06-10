import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSecureRandomInt } from "../src/crypto-utils";

describe("getSecureRandomInt", () => {
  it("throws error if max is <= 0", () => {
    expect(() => getSecureRandomInt(0)).toThrow("Max must be positive");
    expect(() => getSecureRandomInt(-1)).toThrow("Max must be positive");
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
    const max = 0x1_000_0000;
    const val = getSecureRandomInt(max);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(max);
  });

  it("handles max=1 correctly", () => {
    const val = getSecureRandomInt(1);
    expect(val).toBe(0);
  });
});
