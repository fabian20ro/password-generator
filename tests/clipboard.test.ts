import { describe, expect, it } from "vitest";
import { vi } from "vitest";
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

  it("returns false when an empty string is provided", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "")).resolves.toBe(false);
    expect(writes).toEqual([]);
  });

  it("returns false when text is a string with only whitespace", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "   ")).resolves.toBe(false);
    expect(writes).toEqual([]);
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

  it("returns true even if writeText resolves to false", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        return Promise.resolve(false);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(true);
  });

  it("returns true when writing a string with null bytes", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textWithNull = "hello\0world";

    await expect(copyTextToClipboard(clipboard, textWithNull)).resolves.toBe(true);
    expect(writes).toEqual([textWithNull]);
  });

  it("returns true when writeText is on the prototype", async () => {
    const proto = { async writeText(text: string) {} };
    const clipboard = Object.create(proto);
    const result = await copyTextToClipboard(clipboard, "secret");
    expect(result).toBe(true);
  });

  it("returns true when writing a multi-line string", async () => {
    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;
    const multiLineText = "line1\nline2";

    await expect(copyTextToClipboard(clipboard, multiLineText)).resolves.toBe(true);
    expect(writes).toEqual([multiLineText]);
  });

  it("returns false when text is undefined", async () => {
    const clipboard = {
      async writeText(text: string) {}
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, undefined as any)).resolves.toBe(false);
  });

  it("returns false when clipboard is 0", async () => {
    await expect(copyTextToClipboard(0 as any, "secret")).resolves.toBe(false);
  });

  it("returns false when text is an object", async () => {
    const clipboard = {
      async writeText(text: string) {}
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, {} as any)).resolves.toBe(false);
  });

  it("returns false when text is a boolean", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // ignore
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textBool = true;
    await expect(copyTextToClipboard(clipboard, textBool as any)).resolves.toBe(false);
  });

  it("returns false when text is a bigint", async () => {
    const clipboard = {
      async writeText(text: string): Promise<void> {
        // ignore
      },
    } satisfies Pick<Clipboard, "writeText">;
    const textBigInt = 123n;
    await expect(copyTextToClipboard(clipboard, textBigInt as any)).resolves.toBe(false);
  });

  it("falls back to execCommand when clipboard.writeText throws", async () => {
    // Stub global document for fallback path in Node.js vitest (no jsdom)
    const mockTextarea = {
      value: "",
      setAttribute: vi.fn(),
      style: {
        position: "",
        left: "",
      },
      select: vi.fn(),
      setSelectionRange: vi.fn((_start: number, _end: number) => {}),
    };

    vi.stubGlobal("document", {
      createElement: () => mockTextarea as unknown as HTMLTextAreaElement,
      execCommand: (_cmd: string) => true,
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });

    const clipboard = {
      async writeText(): Promise<void> {
        throw new Error("denied");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "fallback")).resolves.toBe(true);
  });

  it("sets tabindex=-1 on fallback textarea for programmatic focusability", async () => {
    let capturedEl: unknown = null;

    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        const el: Record<string, any> = {
          value: "",
          setAttribute: vi.fn(),
          tabIndex: undefined as number | undefined,
          style: { position: "", left: "" },
          select: vi.fn(),
          setSelectionRange: vi.fn((_start: number, _end: number) => {}),
        };
        capturedEl = el;
        return el as unknown as HTMLTextAreaElement;
      },
      execCommand: (_cmd: string) => true,
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });

    await copyTextToClipboard(undefined, "secret");

    // The fallback should set tabIndex = -1 so unfocused elements can be selected on mobile
    expect((capturedEl as any).tabIndex).toBe(-1);
  });

  it("returns false when neither clipboard API nor document available", async () => {
    // Unstub any leftover global mocks to simulate a real Node.js env with no DOM
    vi.unstubAllGlobals();
    await expect(copyTextToClipboard(undefined, "secret")).resolves.toBe(false);
  });

  it("returns false when clipboard API fails and execCommand also returns false", async () => {
    const mockTextarea = {
      value: "",
      setAttribute: vi.fn(),
      style: { position: "", left: "" },
      select: vi.fn(),
      setSelectionRange: vi.fn((_start: number, _end: number) => {}),
    };

    let execCommandCallCount = 0;
    vi.stubGlobal("document", {
      createElement: () => mockTextarea as unknown as HTMLTextAreaElement,
      execCommand: (_cmd: string) => {
        execCommandCallCount++;
        return false; // explicit failure — should not be retried or ignored away
      },
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });

    const clipboard = {
      async writeText(): Promise<void> {
        throw new Error("denied");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
    expect(execCommandCallCount).toBe(1); // fallback attempted exactly once
  });

  it("cleans up textarea when execCommand throws during fallback", async () => {
    const removeChildSpy = vi.fn();
    const mockTextarea = {
      value: "secret",
      setAttribute: vi.fn(),
      style: { position: "", left: "" },
      select: vi.fn(),
      setSelectionRange: vi.fn((_start: number, _end: number) => {}),
    };

    vi.stubGlobal("document", {
      createElement: () => mockTextarea as unknown as HTMLTextAreaElement,
      execCommand: (_cmd: string) => {
        throw new Error("execCommand not supported");
      },
      body: { appendChild: vi.fn(), removeChild: removeChildSpy },
    });

    const clipboard = {
      async writeText(): Promise<void> {
        throw new Error("denied");
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(false);
    expect(removeChildSpy).toHaveBeenCalled(); // finally-block ensures cleanup even on throw
  });

  it("does not invoke fallback when modern clipboard API succeeds", async () => {
    const appendChildSpy = vi.fn();
    vi.stubGlobal("document", {
      createElement: () => ({
        value: "",
        setAttribute: vi.fn(),
        style: { position: "", left: "" },
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      }),
      execCommand: vi.fn(() => false), // should never be reached
      body: { appendChild: appendChildSpy, removeChild: vi.fn() },
    });

    const writes: string[] = [];
    const clipboard = {
      async writeText(text: string): Promise<void> {
        writes.push(text);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await expect(copyTextToClipboard(clipboard, "secret")).resolves.toBe(true);
    expect(writes).toEqual(["secret"]);
    expect(document.execCommand).not.toHaveBeenCalled(); // modern path short-circuits
    vi.unstubAllGlobals();
  });
});
