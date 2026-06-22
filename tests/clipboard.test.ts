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

  it("returns true when writeText is a synchronous function", async () => {
    let called = false;
    const clipboard = {
      writeText(text: string) {
        called = true;
      },
    } as unknown as Pick<Clipboard, "writeText">;

    const result = await copyTextToClipboard(clipboard, "secret");
    expect(result).toBe(true);
    expect(called).toBe(true);
  });

  it("returns false when writing to clipboard fails", async () => {
    const clipboard = {
      async writeText(): Promise<void> {
        throw new Error("denied");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
  });

  it("returns false when writeText throws a non-Error", async () => {
    const clipboard = {
      async writeText(): Promise<void> {
        throw "not an error";
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
  });

  it("returns true when writing a very large string", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const largeText = "a".repeat(10000);

    await expect(copyTextToClipboard(clipboard, largeText)).resolves.toBe(true);
    expect(writes).toEqual([largeText]);
  });

  it("returns false when text is not a string", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // No throw, just accept it
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, null as any)).resolves.toBe(false);
  });

  it("returns false when text is a String object (not a primitive)", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // ignore
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textObj = new String("test");
    await expect(copyTextToClipboard(clipboard, textObj as any)).resolves.toBe(false);
  });

  it("returns false when text is a Number", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // ignore
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textNum = 123;
    await expect(copyTextToClipboard(clipboard, textNum as any)).resolves.toBe(false);
  });

  it("returns false when text is a Symbol", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // ignore
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textSym = Symbol("test");
    await expect(copyTextToClipboard(clipboard, textSym as any)).resolves.toBe(false);
  });

  it("returns true when text contains emojis", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const emojiText = "🚀🔥";

    await expect(copyTextToClipboard(clipboard, emojiText)).resolves.toBe(true);
    expect(writes).toEqual([emojiText]);
  });

  it("returns true when writing only newline characters", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const newlineText = "\n\n";

    await expect(copyTextToClipboard(clipboard, newlineText)).resolves.toBe(true);
    expect(writes).toEqual([newlineText]);
  });

  it("returns true when writing a multi-line string", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const multiLineText = "line1\nline2\nline3";

    await expect(copyTextToClipboard(clipboard, multiLineText)).resolves.toBe(true);
    expect(writes).toEqual([multiLineText]);
  });

  it("returns true when writing a string with various whitespace characters", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const whitespaceText = " \t\n\r\v\f";

    await expect(copyTextToClipboard(clipboard, whitespaceText)).resolves.toBe(true);
    expect(writes).toEqual([whitespaceText]);
  });
});