// Licensed under the MIT License.
import { getSecureRandomInt } from "./crypto-utils";

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
export const DEFAULT_LENGTH = 24;
export const CHARSET_LEN = CHARS.length;

export const LENGTHS = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

export const MAX_LENGTH = 65536;

const AMBIGUOUS_CHARS = new Set(["0", "O", "l", "I", "1"]);

/**
 * Filters out visually ambiguous characters from a charset to prevent
 * transcription errors when copying passwords manually.
 * Excludes: 0/O, l/I/l, 1
 */
function filterAmbiguousCharset(charset: string): string {
  return [...charset].filter(c => !AMBIGUOUS_CHARS.has(c)).join('');
}

/**
 * Generates a cryptographically secure random password with no visually ambiguous characters.
 * Useful for manual copy-paste use cases where chars like '0'/'O', 'l'/'I', '1' are hard to distinguish.
 *
 * @param length The desired length of the password.
 * @returns The generated password string, or empty string if charset is exhausted.
 */
export function generatePasswordAmbiguityFree(length: number): string {
  const filtered = filterAmbiguousCharset(CHARS);
  if (filtered.length === 0) return "";
  return generatePasswordWithCharset(length, filtered);
}

/**
 * Generates a cryptographically secure random password.
 * Uses rejection sampling to prevent modulo bias when mapping the 32-bit
 * random value to the character set.
 * 
 * @param length The desired length of the password.
 * @returns The generated password string.
 */
export function generatePassword(length: number = 24): string {
  return generatePasswordWithCharset(length, CHARS);
}

const ALL_CHARSET = CHARS + SYMBOLS;
const LETTERS_ONLY_CHARSET = CHARS.substring(0, 52);
const NUMBERS_ONLY_CHARSET = CHARS.substring(52);

/**
 * Generates a cryptographically secure random password including symbols.
 * 
 * @param length The desired length of the password.
 * @returns The generated password string.
 */
export function generatePasswordWithSymbols(length: number): string {
  return generatePasswordWithCharset(length, ALL_CHARSET);
}

/**
 * Generates a cryptographically secure random password using only letters.
 * 
 * @param length The desired length of the password.
 * @returns The generated password string.
 */
export function generatePasswordWithLettersOnly(length: number): string {
  return generatePasswordWithCharset(length, LETTERS_ONLY_CHARSET);
}

/**
 * Generates a cryptographically unique random password using only numbers.
 * 
 * @param length: The desired length of the password.
 * @returns The generated password string.
 */
export function generatePasswordWithNumbersOnly(length: number): string {
  return generatePasswordWithCharset(length, NUMBERS_ONLY_CHARSET);
}

/**
 * Generates a cryptographically secure random password using a specific charset.
 * Uses rejection sampling to prevent modulo bias when mapping the 32-bit
 * random value to the character set.
 * 
 * @param length: The desired length of the password.
 * @param charset: The character set to use.
 * @returns The generated password string.
 */
export function generatePasswordWithCharset(length: number, charset: string): string {
  if (!Number.isInteger(length) || length <= 0 || !charset) return "";
  if (length > MAX_LENGTH) throw new Error(`Length exceeds maximum allowed: ${MAX_LENGTH}`);
  const chars = Array.from(charset);
  const charsetLen = chars.length;
  const passwordArray = new Array(length);
  for (let i = 0; i < length; i++) {
    passwordArray[i] = chars[getSecureRandomInt(charsetLen)];
  }
  return passwordArray.join('');
}

export function generateAll(): string[] {
  return LENGTHS.map((len) => generatePassword(len));
}

/**
 * Checks if a password only contains characters from the provided charset.
 * 
 * @param pw: The password to validate.
 * @param charset: The allowed character set.
 * @returns True if all characters in pw are in charset, false otherwise.
 */
export function isValidPassword(pw: string, charset: string): boolean {
  if (pw.length === 0) return false;
  const charSet = new Set(charset);
  for (const char of pw) {
    if (!charSet.has(char)) return false;
  }
  return true;
}

/**
 * Generates a cryptographically secure random password that contains at least 
 * one character from each provided category.
 * 
 * @param length: The desired length of the password.
 * @param categories: An array of character sets (e.g., ['ABC', '123']).
 * @returns The generated password string.
 */
export function generateComplexPassword(length: number, categories: string[][]): string {
  if (!Number.isInteger(length) || length < categories.length || categories.length === 0 || categories.some(c => c.join('').length === 0)) return "";
  if (length > MAX_LENGTH) throw new Error(`Length exceeds maximum allowed: ${MAX_LENGTH}`);
  
  const charSets = categories.map(c => [...c.join('')]);
  const allChars = [...new Set(charSets.flat())];
  if (allChars.length === 0) return "";
  
  const passwordChars = [];
  const remainingLength = length - categories.length;
  
  // 1. Pick one from each category
  for (const category of charSets) {
    const idx = getSecureRandomInt(category.length);
    passwordChars.push(category[idx]);
  }
  
  // 2. Fill the rest
  const extraChars = Array.from({ length: remainingLength }, () => {
    const idx = getSecureRandomInt(allChars.length);
    return allChars[idx];
  });
  
  // 3. Shuffle the password
  const finalChars = [...passwordChars, ...extraChars];
  for (let i = finalChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [finalChars[i], finalChars[j]] = [finalChars[j], finalChars[i]];
  }
  
  return finalChars.join('');
}