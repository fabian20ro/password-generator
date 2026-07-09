import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cli = resolve(repo, "scripts", "generate-dashboard-auth.mjs");

describe("dashboard auth CLI", () => {
  it("generates Hermes dashboard auth YAML", () => {
    const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
    const target = join(directory, "credentials.yaml");
    try {
      const stdout = execFileSync(process.execPath, [
        cli,
        "--output",
        target,
        "--username",
        "fabian",
        "--password-length",
        "32",
        "--secret-length",
        "32",
      ], { encoding: "utf8" });
      const output = readFileSync(target, "utf8");

      expect(stdout).toContain("credentials.yaml (mode 0600)");
      expect(stdout).not.toContain("password:");
      expect(output).toContain("dashboard:");
      expect(output).toContain("basic_auth:");
      expect(output).toContain("username: 'fabian'");
      expect(output).toContain("password_hash: ''");
      expect(output).toContain("session_ttl_seconds: 86400");
      expect(output).toMatch(/password: '[^']{32}'/);
      expect(output).toMatch(/secret: '[^']{69}'/);
      expect(statSync(target).mode & 0o777).toBe(0o600);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("can write JSON for scripts without printing secrets", () => {
    const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
    const target = join(directory, "credentials.json");
    try {
      const stdout = execFileSync(process.execPath, [
        cli,
        "--output",
        target,
        "--username",
        "ops",
        "--json",
      ], { encoding: "utf8" });
      const parsed = JSON.parse(readFileSync(target, "utf8")) as {
        username: string; password: string; secret: string
      };

      expect(stdout).not.toContain(parsed.password);
      expect(stdout).not.toContain(parsed.secret);
      expect(parsed.username).toBe("ops");
      expect(parsed.password).toHaveLength(48);
      expect(parsed.secret.length).toBeGreaterThan(64);

      // File mode 0o600 applies to both YAML and JSON output paths (writeFileSync with mode: 0o600)
      expect(statSync(target).mode & 0o777).toBe(0o600);

      // Secret format: <uuid>-<alphanumeric-string> — observable contract, not just "long enough"
      const secretRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-[A-Za-z0-9]+$/;
      expect(parsed.secret).toMatch(secretRegex);

      // JSON output must not include YAML-only fields (e.g. password_hash) — schema is exact {username, password, secret}
      const jsonKeys = Object.keys(parsed);
      expect(jsonKeys.sort()).toEqual(["password", "secret", "username"]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid usernames with exit code 2", () => {
    const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
    const target = join(directory, "credentials.yaml");
    try {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "--output",
          target,
          "--username",
          "bad user!@#",
          "--password-length",
          "32",
          "--secret-length",
          "32",
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException).status).toBe(2);
      const combinedOutput = [String(err!.stdout ?? ""), String(err!.stderr ?? "")].join("\n");
      expect(combinedOutput).toContain("Username must match");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  describe("argument validation", () => {
    it("rejects missing --output with exit code 2", () => {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "--username",
          "fabian",
          "--password-length",
          "32",
          "--secret-length",
          "32",
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException).status).toBe(2);
      const combinedOutput = [String(err!.stdout ?? ""), String(err!.stderr ?? "")].join("\n");
      expect(combinedOutput).toContain("--output FILE is required");
    });

    it("rejects password-length below 24 with exit code 2", () => {
      const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
      const target = join(directory, "credentials.yaml");
      try {
        let err: NodeJS.ErrnoException | undefined;
        try {
          execFileSync(process.execPath, [
            cli,
            "--output",
            target,
            "--username",
            "fabian",
            "--password-length",
            "10",
            "--secret-length",
            "32",
          ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        } catch (caught) {
          err = caught as NodeJS.ErrnoException;
        }

        expect(err).toBeDefined();
        expect((err as NodeJS.ErrnoException).status).toBe(2);
        const combinedOutput = [String(err!.stdout ?? ""), String(err!.stderr ?? "")].join("\n");
        expect(combinedOutput).toContain("must be an integer");
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("rejects password-length above 256 with exit code 2", () => {
      const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
      const target = join(directory, "credentials.yaml");
      try {
        let err: NodeJS.ErrnoException | undefined;
        try {
          execFileSync(process.execPath, [
            cli,
            "--output",
            target,
            "--username",
            "fabian",
            "--password-length",
            "300",
            "--secret-length",
            "32",
          ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        } catch (caught) {
          err = caught as NodeJS.ErrnoException;
        }

        expect(err).toBeDefined();
        expect((err as NodeJS.ErrnoException).status).toBe(2);
        const combinedOutput = [String(err!.stdout ?? ""), String(err!.stderr ?? "")].join("\n");
        expect(combinedOutput).toContain("must be an integer");
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("rejects non-integer password-length with exit code 2", () => {
      const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
      const target = join(directory, "credentials.yaml");
      try {
        let err: NodeJS.ErrnoException | undefined;
        try {
          execFileSync(process.execPath, [
            cli,
            "--output",
            target,
            "--username",
            "fabian",
            "--password-length",
            "abc",
            "--secret-length",
            "32",
          ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        } catch (caught) {
          err = caught as NodeJS.ErrnoException;
        }

        expect(err).toBeDefined();
        expect((err as NodeJS.ErrnoException).status).toBe(2);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("rejects secret-length out of range with exit code 2", () => {
      const directory = mkdtempSync(join(tmpdir(), "dashboard-auth-"));
      const target = join(directory, "credentials.yaml");
      try {
        let err: NodeJS.ErrnoException | undefined;
        try {
          execFileSync(process.execPath, [
            cli,
            "--output",
            target,
            "--username",
            "fabian",
            "--password-length",
            "32",
            "--secret-length",
            "10",
          ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        } catch (caught) {
          err = caught as NodeJS.ErrnoException;
        }

        expect(err).toBeDefined();
        expect((err as NodeJS.ErrnoException).status).toBe(2);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("--help prints usage and exits cleanly", () => {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "--help",
        ], { encoding: "utf8" });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeUndefined();
    });

    it("-h prints usage and exits cleanly", () => {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "-h",
        ], { encoding: "utf8" });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeUndefined();
    });

    it("rejects empty username with exit code 2", () => {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "--output",
          "/tmp/dashboard-auth-empty.yaml",
          "--username",
          "",
          "--password-length",
          "32",
          "--secret-length",
          "32",
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException).status).toBe(2);
    });

    it("rejects unknown arguments with exit code 2", () => {
      let err: NodeJS.ErrnoException | undefined;
      try {
        execFileSync(process.execPath, [
          cli,
          "--output",
          "/tmp/dashboard-auth-unknown.yaml",
          "--username",
          "fabian",
          "--password-length",
          "32",
          "--secret-length",
          "32",
          "--nonexistent-flag",
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (caught) {
        err = caught as NodeJS.ErrnoException;
      }

      expect(err).toBeDefined();
      expect((err as NodeJS.ErrnoException).status).toBe(2);
    });
  });
});
