export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const CHARSET_LEN = CHARS.length;
const UINT32_MODULUS = 0x1_0000_0000; // 2^32
export const REJECT_THRESHOLD = UINT32_MODULUS - (UINT32_MODULUS % CHARSET_LEN); // 4294967292

export const LENGTHS = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

const RE_SAMPLE_BUF = new Uint32Array(1);

/**
 * Generates a cryptographically secure random password.
 * Uses rejection sampling to prevent modulo bias when mapping the 32-bit
 * random value to the character set.
 * 
 * @param length The desired length of the password.
 * @returns The generated password string.
 */
export function generatePassword(length: number): string {
  if (length <= 0) return "";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let pw = "";
  for (let i = 0; i < length; i++) {
    let val = buf[i];
    while (val >= REJECT_THRESHOLD) {
      crypto.getRandomValues(RE_SAMPLE_BUF);
      val = RE_SAMPLE_BUF[0];
    }
    pw += CHARS[val % CHARSET_LEN];
  }
  return pw;
}

export function generateAll(): string[] {
  return LENGTHS.map((len) => generatePassword(len));
}
