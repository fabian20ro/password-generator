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

function isActualError(err: unknown): err is Error {
  return typeof err === "object" && err !== null && "name" in err && "message" in err;
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
      await clipboard.writeText(text);
      return true;
    } catch (err) {
      // Only fall back to legacy path for genuine Error instances.
      // Non-Error throws (strings, numbers, etc.) are treated as fatal —
      // the caller's API contract was violated and falling back could leak data.
      if (!isActualError(err)) {
        console.error("Clipboard copy failed: non-Error throw");
        return false;
      }
      console.error("Clipboard copy failed:", err);
    }
  }

  // Fall back to legacy execCommand for older browsers / restricted contexts
  if (fallbackCopy(text)) {
    return true;
  }

  console.error("Clipboard copy failed: no API available");
  return false;
}