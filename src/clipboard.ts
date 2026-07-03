/**
 * Fallback copy using document.execCommand("copy") for environments where
 * navigator.clipboard is unavailable. Requires a focused textarea element to
 * work reliably in older browsers (IE11, old Firefox).
 */
function fallbackCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.tabIndex = -1; // ensures programmatic focus on mobile browsers where unfocused elements can't be selected
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  let success = false;

  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    success = document.execCommand("copy");
  } catch {
    // ignore — success stays false
  } finally {
    document.body.removeChild(textarea);
  }

  return Boolean(success);
}

export async function copyTextToClipboard(
  clipboard: Pick<Clipboard, "writeText"> | undefined,
  text: string,
): Promise<boolean> {
  if (typeof text !== "string" || text.trim().length === 0) {
    return false;
  }

  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      const result = await clipboard.writeText(text);
      // writeText returns void on success per its declared return type, but some
      // polyfills incorrectly signal failure by returning false or null. Cast to
      // unknown so we can safely compare at runtime without violating the
      // declared return type.
      if ((result as unknown) === false || (result as unknown) === null) {
        throw new Error("polyfill reported clipboard failure");
      }
      return true;
    } catch {
      // writeText returned undefined (e.g., primitive boxed into object with no
      // real method), threw, or polyfill flagged failure — fall back to legacy.
      // We already possess the text; falling back cannot leak additional data,
      // and writeText may throw non-Error values in edge cases (e.g., polyfills).
    }
  }

  // Fall back to legacy execCommand for older browsers / restricted contexts
  if (fallbackCopy(text)) {
    return true;
  }

  console.error("Clipboard copy failed: no API available");
  return false;
}