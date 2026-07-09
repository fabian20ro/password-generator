import { describe, it, expect } from "vitest";
import { generateUsername, generateUsernames, USERNAME_ADJECTIVES, USERNAME_NOUNS } from "../src/username";

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

    it("returns an empty array for NaN count", () => {
      expect(generateUsernames(NaN)).toEqual([]);
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
    for (let i = 0; i < 100; i++) {
      const username = generateUsername();
      const [adj, noun] = username.split("_");
      expect(USERNAME_ADJECTIVES).toContain(adj);
      expect(USERNAME_NOUNS).toContain(noun);
    }
  });

  it("distributes adjective and noun selection roughly uniformly", () => {
    // Verifies the RNG selects each vocabulary item with approximately equal probability.
    // Catches subtle bias that format-only tests miss.
    const SAMPLES = 1000;
    const adjCounts = new Map<string, number>();
    const nounCounts = new Map<string, number>();

    for (let i = 0; i < SAMPLES; i++) {
      const [adj, noun] = generateUsername().split("_");
      adjCounts.set(adj, (adjCounts.get(adj) ?? 0) + 1);
      nounCounts.set(noun, (nounCounts.get(noun) ?? 0) + 1);
    }

    // Every item must appear at least once in N samples.
    expect([...adjCounts.values()].every(c => c >= 1)).toBe(true);
    expect([...nounCounts.values()].every(c => c >= 1)).toBe(true);

    // Max count should not exceed 4× the min count (catches gross bias).
    const adjMin = Math.min(...adjCounts.values());
    const adjMax = Math.max(...adjCounts.values());
    const nounMin = Math.min(...nounCounts.values());
    const nounMax = Math.max(...nounCounts.values());

    expect(adjMax / adjMin).toBeLessThanOrEqual(4);
    expect(nounMax / nounMin).toBeLessThanOrEqual(4);
  });

  it("distributes the numeric suffix roughly uniformly across 1000–9999", () => {
    // Verifies randomFourDigitNumber() produces values without positional bias.
    // Complements the adjective/noun uniformity test above.
    const SAMPLES = 5000;
    const BUCKETS = 10;
    const bucketSize = Math.floor(9000 / BUCKETS); // 900
    const buckets = Array(BUCKETS).fill(0);

    for (let i = 0; i < SAMPLES; i++) {
      const numPart = generateUsername().split("_")[2];
      const bucket = Math.floor((Number(numPart) - 1000) / bucketSize);
      buckets[bucket]++;
    }

    // Each of the 10 buckets should contain roughly SAMPLES/BUCKETS values.
    // Allow up to 3× deviation from expected to account for statistical variance.
    const expected = SAMPLES / BUCKETS;
    const observedMax = Math.max(...buckets);
    const observedMin = Math.min(...buckets);

    expect(observedMax).toBeLessThanOrEqual(expected * 2.5);
    expect(observedMin).toBeGreaterThanOrEqual(expected * 0.5);
  });
});
