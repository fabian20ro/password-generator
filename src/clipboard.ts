export async function copyTextToClipboard(
  clipboard: Pick<Clipboard, "writeText"> | undefined,
  text: string,
): Promise<boolean> {
  if (typeof clipboard?.writeText !== "function" || typeof text !== "string") {
    return false;
  }

  try {
    await clipboard.writeText(text);
    return true;
  } catch (err) {
    if (err instanceof Error) {
      console.warn("Failed to copy text to clipboard:", err.message);
    } else {
      console.warn("Failed to copy text to clipboard:", String(err));
    }
    return false;
  }
}
