export const UINT32_MODULUS = 0x1_0000_0000;

/**
 * Generates a random integer in the range [0, max) using rejection sampling
 * to avoid modulo bias.
 * 
 * @param max The upper bound (exclusive).
 * @returns A random integer.
 */
export function getSecureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_MODULUS) {
    throw new Error("Max must be between 1 and UINT32_MODULUS");
  }

  const crypto = globalThis.crypto?.getRandomValues;
  if (typeof crypto !== "function") {
    throw new Error("Crypto API unavailable — cannot generate secure random values");
  }

  const threshold = UINT32_MODULUS - (UINT32_MODULUS % max);
  const buf = new Uint32Array(1);

  do {
    try {
      globalThis.crypto!.getRandomValues(buf);
    } catch {
      throw new Error("Crypto API unavailable — cannot generate secure random values");
    }
  } while (buf[0] >= threshold);

  return buf[0] % max;
}
