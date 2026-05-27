import { describe, it, expect } from "vitest";
import { generateUsername, generateUsernames } from "../src/username";

describe("username generation", () => {
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
});
