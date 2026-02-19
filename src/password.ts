const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CHARSET_LEN = CHARS.length;
const MAX_U32 = 0x1_0000_0000; // 2^32
const REJECT_THRESHOLD = MAX_U32 - (MAX_U32 % CHARSET_LEN); // 4294967292

export const LENGTHS = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;

export function generatePassword(length: number): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let pw = "";
  for (let i = 0; i < length; i++) {
    let val = buf[i];
    while (val >= REJECT_THRESHOLD) {
      val = crypto.getRandomValues(new Uint32Array(1))[0];
    }
    pw += CHARS[val % CHARSET_LEN];
  }
  return pw;
}

export function generateAll(): string[] {
  return LENGTHS.map((len) => generatePassword(len));
}
