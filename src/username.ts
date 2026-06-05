const USERNAME_ADJECTIVES = [
  "agile", "brave", "calm", "clever", "curious",
  "eager", "fierce", "gentle", "happy", "jolly",
  "kind", "lively", "mighty", "nimble", "playful",
  "proud", "quick", "sly", "swift", "wild",
] as const;

const USERNAME_NOUNS = [
  "antelope", "badger", "beaver", "buffalo", "cougar",
  "dolphin", "eagle", "falcon", "fox", "jaguar",
  "lemur", "lynx", "otter", "panther", "rabbit",
  "raven", "tiger", "walrus", "wolf", "zebra",
] as const;

const UINT32_MODULUS = 0x1_0000_0000; // 2^32

function randomIndex(length: number): number {
  const rejectThreshold = UINT32_MODULUS - (UINT32_MODULUS % length);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let val = buf[0];
  while (val >= rejectThreshold) {
    crypto.getRandomValues(buf);
    val = buf[0];
  }
  return val % length;
}

function randomFourDigitNumber(): string {
  const range = 9000;
  const rejectThreshold = UINT32_MODULUS - (UINT32_MODULUS % range);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let val = buf[0];
  while (val >= rejectThreshold) {
    crypto.getRandomValues(buf);
    val = buf[0];
  }
  const num = (val % range) + 1000;
  return num.toString();
}

export function generateUsername(): string {
  const adjective = USERNAME_ADJECTIVES[randomIndex(USERNAME_ADJECTIVES.length)];
  const noun = USERNAME_NOUNS[randomIndex(USERNAME_NOUNS.length)];
  return `${adjective}_${noun}_${randomFourDigitNumber()}`;
}

export function generateUsernames(count: number): string[] {
  return Array.from({ length: count }, () => generateUsername());
}
