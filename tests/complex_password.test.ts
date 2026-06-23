import { describe, expect, it } from "vitest";
import { generateComplexPassword } from "../src/password";

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
});
