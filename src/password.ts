export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
export const CHARSET_LEN = CHARS.length;
const UINT32_MODULUS = 0x1_0000_0000; // 2^32
/**
 * The largest multiple of charsetLen that is strictly less than UINT32_MODULUS.
 * We reject values in the range [REJECT_THRESHOLD, UINT32_MODULUS) to prevent modulo bias.
 */
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
  return generatePasswordWithCharset(length, CHARS);
}

/**
 * Generates a cryptographically secure random password including symbols.
 * 
 * @param length The desired length of the password.
 * @returns The generated password string.
 */
export function generatePasswordWithSymbols(length: number): string {
  return generatePasswordWithCharset(length, CHARS + SYMBOLS);
}

/**
 * Generates a cryptographically secure random password using a specific charset.
 * Uses rejection sampling to prevent modulo bias when mapping the 32-bit
 * random value to the character set.
 * 
 * @param length The desired length of the password.
 * @param charset The character set to use.
 * @returns The generated password string.
 */
export function generatePasswordWithCharset(length: number, charset: string): string {
  if (!Number.isInteger(length) || length <= 0 || charset.length === 0) return "";
  const chars = Array.from(charset);
  const charsetLen = chars.length;
  const rejectThreshold = UINT32_MODULUS - (UINT32_MODULUS % charsetLen);
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let pw = "";
  for (let i = 0; i < length; i++) {
    let val = buf[i];
    while (val >= rejectThreshold) {
      crypto.getRandomValues(RE_SAMPLE_BUF);
      val = RE_SAMPLE_BUF[0];
    }
    pw += chars[val % charsetLen];
  }
  return pw;
}

export function generateAll(): string[] {
  return LENGTHS.map((len) => generatePassword(len));
}

/**
 * Checks if a password only contains characters from the provided charset.
 * 
 * @param pw The password to validate.
 * @param charset The allowed character set.
 * @returns True if all characters in pw are in charset, false otherwise.
 */
export function isValidPassword(pw: string, charset: string): boolean {
  return [...pw].every((char) => charset.includes(char));
}
