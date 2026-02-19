const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const LENGTHS = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

export function generatePassword(length: number): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += CHARS[buf[i] % CHARS.length];
  }
  return pw;
}

export function generateAll(): string[] {
  return LENGTHS.map((len) => generatePassword(len));
}
