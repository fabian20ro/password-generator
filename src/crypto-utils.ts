export const UINT32_MODULUS = 0x1_0000_0000;

/**
 * Generates a random integer in the range [0, max) using rejection sampling
 * to avoid modulo bias.
 * 
 * @param max The upper bound (exclusive).
 * @returns A random integer.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0 || max > UINT32_MODULUS || max % 1 !== 0) {
    throw new Error("Max must be between 1 and UINT32_MODULUS");
  }
  
  const buf = new Uint32Array(1);
  
  do {
    globalThis.crypto.getRandomValues(buf);
  } while (buf[0] >= UINT32_MODULUS - (UINT32_MODULUS % max));
  
  return buf[0] % max;
}
