import { describe, it, expect } from "vitest";
import { generateUsername, generateUsernames } from "../src/username";

describe("username generation", () => {
  describe("generateUsername()", () => {
    it("returns three underscore-separated parts: adjective_noun_4digits", () => {
      for (let i = 0; i < 50; i++) {
        const username = generateUsername();
        const parts = username.split("_");
        expect(parts).toHaveLength(3);
        expect(parts[0]).toMatch(/^[a-z]+$/);
        expect(parts[1]).toMatch(/^[a-z]+$/);
        expect(parts[2]).toMatch(/^[0-9]{4}$/);
      }
    });

    it("returns a string in the full lowercase-alpha format", () => {
      for (let i = 0; i < 50; i++) {
        const username = generateUsername();
        expect(username).toMatch(/^[a-z]+_[a-z]+_[0-9]{4}$/);
      }
    });

    it("returns a string with no uppercase letters or special characters", () => {
      for (let i = 0; i < 50; i++) {
        const username = generateUsername();
        expect(username).not.toMatch(/[A-Z]/);
        expect(username).not.toMatch(/[^a-z0-9_]/);
      }
    });
  });

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

    it("returns an array of length 1 when count is 1", () => {
      const usernames = generateUsernames(1);
      expect(usernames).toHaveLength(1);
      expect(usernames[0]).toMatch(/^[a-z]+_[a-z]+_[0-9]{4}$/);
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

  it("only emits adjectives and nouns from their defined lists", () => {
    // Source-defined vocabulary — must stay in sync with generator output.
    const adjectiveList = [
      "agile", "brave", "calm", "clever", "curious",
      "eager", "fierce", "gentle", "happy", "jolly",
      "kind", "lively", "mighty", "nimble", "playful",
      "proud", "quick", "sly", "swift", "wild",
      "ancient", "awesome", "bright", "bouncy", "chill",
      "mystic", "radiant", "silent", "vibrant", "zen", "astral", "cosmic", "lunar", "solar", "stellar",
      "legendary", "epic", "zenith",
    ] as const;

    const nounList = [
      "antelope", "badger", "beaver", "buffalo", "cougar",
      "dolphin", "eagle", "falcon", "fox", "jaguar",
      "lemur", "lynx", "otter", "panther", "rabbit",
      "raven", "tiger", "walrus", "wolf", "zebra",
      "arctic", "atlas", "blaze", "breeze", "chaos",
      "nebula", "quasar", "pulsar", "comet", "meteor", "galaxy", "asteroid", "supernova", "planet", "star",
      "dragon", "phoenix", "kraken",
    ] as const;

    for (let i = 0; i < 100; i++) {
      const username = generateUsername();
      const [adj, noun] = username.split("_");
      expect(adjectiveList).toContain(adj);
      expect(nounList).toContain(noun);
    }
  });
});
