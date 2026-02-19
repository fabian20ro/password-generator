import { describe, it, expect, vi } from "vitest";
import { generatePassword, generateAll, LENGTHS } from "../src/password";

describe("generatePassword", () => {
  it("returns a string of the requested length", () => {
    for (const len of [1, 10, 23, 27, 50]) {
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
    let callCount = 0;
    const spy = vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      const u32 = array as Uint32Array;
      callCount++;
      if (callCount === 1) {
        // Initial buffer fill: use a value above the rejection threshold
        u32[0] = 4294967295; // max Uint32, above threshold 4294967292
      } else if (callCount === 2) {
        // Resample call: return a valid value
        u32[0] = 42;
      }
      return array;
    });

    const pw = generatePassword(1);
    expect(pw).toHaveLength(1);
    expect(pw).toMatch(/^[A-Za-z0-9]$/);
    expect(callCount).toBe(2); // initial fill + one resample
    spy.mockRestore();
  });
});
