import { getSecureRandomInt } from "./crypto-utils";

export const USERNAME_ADJECTIVES: readonly string[] = [
  "agile", "brave", "calm", "clever", "curious",
  "eager", "fierce", "gentle", "happy", "jolly",
  "kind", "lively", "mighty", "nimble", "playful",
  "proud", "quick", "sly", "swift", "wild",
  "ancient", "awesome", "bright", "bouncy", "chill",
  "mystic", "radiant", "silent", "vibrant", "zen", "astral", "cosmic", "lunar", "solar", "stellar",
  "legendary", "epic", "zenith",
];

export const USERNAME_NOUNS: readonly string[] = [
  "antelope", "badger", "beaver", "buffalo", "cougar",
  "dolphin", "eagle", "falcon", "fox", "jaguar",
  "lemur", "lynx", "otter", "panther", "rabbit",
  "raven", "tiger", "walrus", "wolf", "zebra",
  "arctic", "atlas", "blaze", "breeze", "chaos",
  "nebula", "quasar", "pulsar", "comet", "meteor", "galaxy", "asteroid", "supernova", "planet", "star",
  "dragon", "phoenix", "kraken",
] as const;

function randomFourDigitNumber(): string {
  const range = 9000;
  const num = getSecureRandomInt(range) + 1000;
  return num.toString();
}

export function generateUsername(): string {
  const adjective = USERNAME_ADJECTIVES[getSecureRandomInt(USERNAME_ADJECTIVES.length)];
  const noun = USERNAME_NOUNS[getSecureRandomInt(USERNAME_NOUNS.length)];
  return `${adjective}_${noun}_${randomFourDigitNumber()}`;
}

export function generateUsernames(count: number): string[] {
  if (!Number.isInteger(count) || count <= 0) return [];
  return Array.from({ length: count }, () => generateUsername());
}
