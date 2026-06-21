import { describe, expect, it } from "vitest";
import { copyTextToClipboard } from "../src/clipboard";

describe("copyTextToClipboard", () => {
  it("returns false when clipboard API is unavailable", async () => {
    await expect(copyTextToClipboard(undefined, "secret")).resolves.toBe(false);
  });

  it("returns false when clipboard is null", async () => {
    await expect(copyTextToClipboard(null as any, "secret")).resolves.toBe(false);
  });

  it("returns false when writeText is missing", async () => {
    const clipboard = {} as Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
  });

  it("returns false when writeText is not callable", async () => {
    const clipboard = { writeText: "nope" } as unknown as Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
  });

  it("returns true when text is written successfully", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(true);
    expect(writes).toEqual(["secret"]);
  });

  it("returns true when an empty string is written successfully", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "")).resolves.toBe(true);
    expect(writes).toEqual([""]);
  });

  it("returns false when writing to clipboard fails", async () => {
    const clipboard = {
      async writeText(): Promise<void> {
        throw new Error("denied");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
  });

  it("returns false when text is not a string", async () => {
    const clipboard = {
      async writeText(text: any): Promise<void> {
        if (typeof text !== "string") throw new TypeError("Expected string");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, null as any)).resolves.toBe(false);
  });
});