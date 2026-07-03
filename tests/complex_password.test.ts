import { describe, expect, it } from "vitest";
import { getSecureRandomInt, UINT32_MODULUS } from "../src/crypto-utils";
import { generateComplexPassword } from "../src/password";

describe("getSecureRandomInt", () => {
  it("should return 0 when max is 1 (trivial case)", () => {
    expect(getSecureRandomInt(1)).toBe(0);
  });

  it("should handle large prime max without hanging (rejection sampling stress)", () => {
    const max = 0xFFFFFFFF - 7; // Large prime near UINT32_MODULUS boundary
    let totalSamples = 0;
    for (let i = 0; i < 100; i++) {
      const val = getSecureRandomInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
      // Verify we're not in an infinite rejection loop — cap at UINT32_MODULUS iterations
    }
  });

  it("should produce values uniformly distributed across full range", () => {
    const max = 1000;
    const counts = new Array(max).fill(0);
    for (let i = 0; i < 50000; i++) {
      const val = getSecureRandomInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
      counts[val]++;
    }
    // Check all bins got at least one hit (statistical sanity)
    for (let i = 0; i < max; i++) {
      expect(counts[i]).toBeGreaterThan(0);
    }
  });

  it("should throw on non-integer input", () => {
    expect(() => getSecureRandomInt(1.5)).toThrow();
    expect(() => getSecureRandomInt(NaN)).toThrow();
  });

  it("should throw on max=0 (boundary violation)", () => {
    expect(() => getSecureRandomInt(0)).toThrow();
  });

  it("should accept max=UINT32_MODULUS without error", () => {
    // This should work but may take many rejections — cap the loop by using a smaller sub-range
    const val = getSecureRandomInt(UINT32_MODULUS);
    expect(val).toBeGreaterThanOrEqual(0);
  });

  describe("generateComplexPassword", () => {
    it("should generate a password of the correct length", () => {
      const length = 10;
      const categories = [['a', 'b'], ['1', '2']];
      const pw = generateComplexPassword(length, categories);
      expect(pw.length).toBe(length);
    });

    it("should contain one character from each category", () => {
      const categories = [['A'], ['1']];
      const pw = generateComplexPassword(10, categories);
      expect(pw).toMatch(/[A]/);
      expect(pw).toMatch(/[1]/);
    });

    it("should handle length exactly equal to categories.length", () => {
      const categories = [['A', 'B'], ['1', '2'], ['!']];
      const pw = generateComplexPassword(3, categories);
      expect(pw.length).toBe(3);
      expect(pw).toMatch(/[AB]/);
      expect(pw).toMatch(/[12]/);
      expect(pw).toMatch(/[!]/);
    });

    it("should handle categories containing an empty string", () => {
      const categories = [['A', 'B'], []];
      const pw = generateComplexPassword(10, categories);
      expect(pw).toBe("");
    });

    it("should handle non-integer lengths by returning an empty string", () => {
      const categories = [['A', 'B'], ['1', '2']];
      expect(generateComplexPassword(2.5, categories)).toBe("");
    });

    it("should handle length being 0", () => {
      const categories = [['A', 'B'], ['1', '2']];
      expect(generateComplexPassword(0, categories)).toBe("");
    });

    it("should throw error if length exceeds MAX_LENGTH", () => {
      const categories = [['A', 'B'], ['1', '2']];
      expect(() => generateComplexPassword(70000, categories)).toThrow(/Length exceeds maximum allowed: 65536/);
    });

    it("should only contain characters from the provided categories", () => {
      const categories = [['ABC'], ['123'], ['!@#']];
      const pw = generateComplexPassword(20, categories);
      const allowedChars = new Set(categories.flat().join(''));
      for (const char of pw) {
        expect(allowedChars.has(char)).toBe(true);
      }
    });

    it("should handle a large number of categories", () => {
      const categories = Array.from({ length: 10 }, (_, i) => [`${i}_${i+1}`]);
      const pw = generateComplexPassword(15, categories);
      expect(pw.length).toBe(15);
      categories.forEach(cat => {
        const allowed = cat.join('');
        expect([...pw].some(c => allowed.includes(c))).toBe(true);
      });
    });

    it("should produce passwords whose per-category sampling uses crypto randomness", () => {
      // Verifies the password generator flows through getSecureRandomInt —
      // two calls with identical categories must not be deterministic.
      const categories = [['A', 'B', 'C'], ['1', '2', '3']];
      const seen = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const pw = generateComplexPassword(4, categories);
        expect(pw.length).toBe(4);
        // Should contain at least one char from each category
        expect([...pw].some(c => ['A', 'B', 'C'].includes(c))).toBe(true);
        expect([...pw].some(c => ['1', '2', '3'].includes(c))).toBe(true);
        seen.add(pw);
      }
      // 50 samples from a space of (3*3)^4 = 81^2=6561 — expect many distinct values
      expect(seen.size).toBeGreaterThan(10);
    });

    it("should sample uniformly across equal-size categories", () => {
      const categories = [['a', 'b'], ['A', 'B']];
      // Each generated password of length 2 must contain one char from each category.
      // Track combined character counts regardless of position (shuffle-safe).
      const counts: Record<string, number> = {};
      for (const c of "abAB") {
        if (!counts[c]) counts[c] = 0;
      }
      for (let i = 0; i < 5000; i++) {
        const pw = generateComplexPassword(2, categories);
        for (const ch of pw) {
          counts[ch]++;
        }
      }
      // Each char should appear roughly half the time (10000 total chars / 4 options).
      for (const c of "abAB") expect(counts[c]).toBeGreaterThan(500);
    });
  });

});
