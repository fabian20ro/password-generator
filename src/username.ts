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

function randomIndex(length: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % length;
}

function randomFourDigitNumber(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const num = (buf[0] % 9000) + 1000;
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
