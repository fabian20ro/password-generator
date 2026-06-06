import { describe, it, expect } from "vitest";
import { generateUsername, generateUsernames } from "../src/username";

describe("username generation", () => {
  describe("edge cases", () => {
    it("returns an empty array for count 0", () => {
      expect(generateUsernames(0)).toEqual([]);
    });

    it("returns an empty array for negative counts", () => {
      expect(generateUsernames(-1)).toEqual([]);
      expect(generateUsernames(-10)).toEqual([]);
    });

    it("returns an empty array for non-integer counts", () => {
      expect(generateUsernames(2.5)).toEqual([]);
    });
  });

  it("matches the pattern [a-z]+_[a-z]+_[0-9]+", () => {
    for (let i = 0; i < 50; i++) {
      const username = generateUsername();
      expect(username).toMatch(/^[a-z]+_[a-z]+_[0-9]{4}$/);
    }
  });

  it("generates the requested number of usernames", () => {
    const usernames = generateUsernames(5);
    expect(usernames).toHaveLength(5);
    usernames.forEach(username => {
      expect(username).toMatch(/^[a-z]+_[a-z]+_[0-9]{4}$/);
    });
  });

  it("generates different usernames on successive calls", () => {
    const usernames = new Set(Array.from({ length: 50 }, () => generateUsername()));
    expect(usernames.size).toBeGreaterThan(1);
  });

  it("generates four-digit numbers in the range 1000–9999", () => {
    for (let i = 0; i < 50; i++) {
      const username = generateUsername();
      const numPart = username.split("_")[2];
      expect(numPart).toMatch(/^[0-9]{4}$/);
      const num = Number(numPart);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });
});
