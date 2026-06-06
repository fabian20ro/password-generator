export const UINT32_MODULUS = 0x1_0000_0000;

/**
 * Generates a random integer in the range [0, max) using rejection sampling
 * to avoid modulo bias.
 * 
 * @param max The upper bound (exclusive).
 * @returns A random integer.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) throw new Error("Max must be positive");
  
  const rejectThreshold = UINT32_MODULUS - (UINT32_MODULUS % max);
  const buf = new Uint32Array(1);
  let val = buf[0];
  
  // Initial sample
  crypto.getRandomValues(buf);
  val = buf[0];
  
  while (val >= rejectThreshold) {
    crypto.getRandomValues(buf);
    val = buf[0];
  }
  
  return val % max;
}
