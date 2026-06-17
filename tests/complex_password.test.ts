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

  it("should handle short lengths where length < categories.length", () => {
    const categories = [['A', 'B'], ['1', '2'], ['!']];
    const pw = generateComplexPassword(2, categories);
    expect(pw).toBe("");
  });

  it("should handle categories containing an empty string", () => {
    const categories = [['A', 'B'], []];
    const pw = generateComplexPassword(10, categories);
    expect(pw).toBe("");
  });

  it("should handle length being a non-integer", () => {
    const categories = [['A', 'B'], ['1', '2']];
    const pw = (generateComplexPassword(5.5, categories) as any);
    expect(pw).toBe("");
  });

  it("should handle non-integer lengths by returning empty string", () => {
    const categories = [['A', 'B'], ['1', '2']];
    expect(generateComplexPassword(2.5, categories)).toBe("");
  });

  it("should handle length being 0", () => {
    const categories = [['A', 'B'], ['1', '2']];
    expect(generateComplexPassword(0, categories)).toBe("");
  });

  it("should throw error if length exceeds MAX_LENGTH", () => {
    const categories = [['A', 'B'], ['1', '2']];
    expect(() => generateComplexPassword(70000, categories)).toThrow(/Length exceeds maximum allowed/);
  });
});
