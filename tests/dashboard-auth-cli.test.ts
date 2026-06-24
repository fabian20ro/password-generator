import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cli = resolve(repo, "scripts", "generate-dashboard-auth.mjs");

describe("dashboard auth CLI", () => {
  it("generates Hermes dashboard auth YAML", () => {
    const output = execFileSync(process.execPath, [
      cli,
      "--username",
      "fabian",
      "--password-length",
      "32",
      "--secret-length",
      "32",
    ], { encoding: "utf8" });

    expect(output).toContain("dashboard:");
    expect(output).toContain("basic_auth:");
    expect(output).toContain("username: 'fabian'");
    expect(output).toContain("password_hash: ''");
    expect(output).toContain("session_ttl_seconds: 86400");
    expect(output).toMatch(/password: '[^']{32}'/);
    expect(output).toMatch(/secret: '[^']{69}'/);
  });

  it("can emit JSON for scripts", () => {
    const output = execFileSync(process.execPath, [
      cli,
      "--username",
      "ops",
      "--json",
    ], { encoding: "utf8" });
    const parsed = JSON.parse(output) as { username: string; password: string; secret: string };

    expect(parsed.username).toBe("ops");
    expect(parsed.password).toHaveLength(48);
    expect(parsed.secret.length).toBeGreaterThan(64);
  });
});
