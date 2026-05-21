# Password Generator

[![Deploy to GitHub Pages](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml)

**[Live Site](https://fabian20ro.github.io/password-generator/)** 

Simple password generator that creates 10 cryptographically secure alphanumeric passwords (23–32 characters).

Uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) (`crypto.getRandomValues()`) — the browser's built-in CSPRNG, equivalent to Java's `SecureRandom`.
10|Password characters are sampled with rejection sampling to avoid modulo bias.
11|
12|## Security
13|
14|This generator uses the Web Crypto API (`crypto.getRandomValues()`) for cryptographically secure random number generation. To prevent **modulo bias** (where some characters appear more frequently than others when the charset length does not perfectly divide the 32-bit random integer range), it employs **rejection sampling**.
15|
16|## Usage

### Basic usage (alphanumeric)
```typescript
import { generatePassword } from './src/password';
const pw = generatePassword(24); 
// "aB3dE..." (24 chars long)
```

### With symbols
```typescript
import { generatePasswordWithSymbols } from './src/password';
const pw = generatePasswordWithSymbols(32);
// "p@ssw0rd!_..." (32 chars long, including symbols)
```
