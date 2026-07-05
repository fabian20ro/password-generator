/**
 * Fallback copy using document.execCommand("copy") for environments where
 * navigator.clipboard is unavailable. Requires a focused textarea element to
 * work reliably in older browsers (IE11, old Firefox).
 */
function fallbackCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return false;
  }

  // Guard against document.body being null/undefined — e.g. during early DOM
  // lifecycle or unusual browser states. Without this, `body.appendChild` at
  // line 17 would throw a TypeError that propagates up uncaught (copyTextToClipboard
  // calls fallbackCopy without try/catch). Returning false here keeps the user
  // experience clean and lets the caller handle the failure gracefully.
  if (!(document as { body?: unknown }).body) {
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
    try {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    } catch {
      // selection can fail in some browsers (e.g., off-screen textarea on mobile)
      // but execCommand("copy") may still succeed — proceed anyway.
    }
    success = document.execCommand("copy");
  } catch {
    // ignore — success stays false
  } finally {
    // Guard against removeChild throwing if appendChild failed silently or
    // body is unavailable — without this, a single failure cascades into two.
    try {
      document.body.removeChild(textarea);
    } catch {}
  }

  return Boolean(success);
}

const CLIPBOARD_TIMEOUT_MS = 3000;

export async function copyTextToClipboard(
  clipboard: Pick<Clipboard, "writeText"> | undefined,
  text: string,
): Promise<boolean> {
  if (typeof text !== "string" || text.trim().length === 0) {
    return false;
  }

  // In insecure contexts both navigator.clipboard and execCommand("copy") fail;
  // short-circuit to avoid creating hidden DOM elements unnecessarily. Only
  // bail out when isSecureContext explicitly reports false — undefined (e.g. in
  // older browsers that lack the property but still support execCommand) must
  // fall through so the fallback can be attempted.
  if (typeof window !== "undefined" && (window as { isSecureContext?: boolean }).isSecureContext === false) {
    return false;
  }

  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      // Guard against writeText hanging indefinitely in slow/unresponsive pages.
      // Normal writes complete in <50 ms, so 3 s is a generous upper bound that
      // will not affect real users but prevents the app from deadlocking on edge
      // cases (e.g., background tabs throttled by the browser). The timeout id
      // is captured for cleanup regardless of resolution order.
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          clipboard.writeText(text),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Clipboard API timed out")), CLIPBOARD_TIMEOUT_MS);
          }),
        ]);
        // writeText returns void on success per its declared return type, but some
        // polyfills incorrectly signal failure by returning false or null. Cast to
        // unknown so we can safely compare at runtime without violating the
        // declared return type.
        if ((result as unknown) === false || (result as unknown) === null) {
          throw new Error("polyfill reported clipboard failure");
        }
        return true;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
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
