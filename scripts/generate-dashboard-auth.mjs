#!/usr/bin/env node
import { randomInt, randomUUID } from "node:crypto";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const DEFAULT_PASSWORD_LENGTH = 48;
const DEFAULT_SECRET_LENGTH = 64;

function usage() {
  return [
    "Usage: npm run dashboard-auth -- [--username NAME] [--password-length N] [--secret-length N] [--json]",
    "",
    "Generates Hermes dashboard basic_auth credentials.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    username: "fabian",
    passwordLength: DEFAULT_PASSWORD_LENGTH,
    secretLength: DEFAULT_SECRET_LENGTH,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--username") {
      options.username = argv[++index] ?? "";
      continue;
    }
    if (arg === "--password-length") {
      options.passwordLength = Number(argv[++index]);
      continue;
    }
    if (arg === "--secret-length") {
      options.secretLength = Number(argv[++index]);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(options.username)) {
    throw new Error("Username must match [A-Za-z0-9._-]{1,64}");
  }
  for (const [label, value] of [
    ["password length", options.passwordLength],
    ["secret length", options.secretLength],
  ]) {
    if (!Number.isInteger(value) || value < 24 || value > 256) {
      throw new Error(`${label} must be an integer from 24 to 256`);
    }
  }
  return options;
}

function randomString(length, charset) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += charset[randomInt(charset.length)];
  }
  return value;
}

function yamlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function generate(options) {
  const strongCharset = ALPHANUMERIC + SYMBOLS;
  return {
    username: options.username,
    password: randomString(options.passwordLength, strongCharset),
    secret: `${randomUUID()}-${randomString(options.secretLength, ALPHANUMERIC)}`,
  };
}

function renderYaml(credentials) {
  return [
    "dashboard:",
    "  basic_auth:",
    `    username: ${yamlQuote(credentials.username)}`,
    `    password: ${yamlQuote(credentials.password)}`,
    `    secret: ${yamlQuote(credentials.secret)}`,
    "    password_hash: ''",
    "    session_ttl_seconds: 86400",
  ].join("\n");
}

try {
  const options = parseArgs(process.argv.slice(2));
  const credentials = generate(options);
  if (options.json) {
    console.log(JSON.stringify(credentials, null, 2));
  } else {
    console.log(renderYaml(credentials));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage());
  process.exit(2);
}
