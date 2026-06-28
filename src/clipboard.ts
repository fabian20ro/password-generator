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
  } catch (error) {
    console.error("Failed to copy text to clipboard:", error);
    return false;
  }
}
