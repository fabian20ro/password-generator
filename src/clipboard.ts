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

export const CLIPBOARD_TIMEOUT_MS = 3000;

/**
 * Verifies that the Clipboard API actually works in this context — not just
 * that it exists. Attempts a zero-length write via navigator.clipboard.writeText("")
 * and returns true if it succeeds (or resolves without rejection). Returns false
 * on any error, timeout, or rejection. Use this to gate UI decisions (e.g., show
 * an "clipboard unavailable" banner) rather than relying solely on canCopyToClipboard(),
 * which only checks API existence.
 *
 * Safe: does not expose user data, does not mutate DOM, and completes within
 * the configured timeout even if the browser hangs.
 */
export async function probeClipboard(timeoutMs = CLIPBOARD_TIMEOUT_MS): Promise<boolean> {
  const api = getClipboardAPI();

  // Short-circuit when API object is absent — no point attempting a write.
  if (!api || typeof api.writeText !== "function") {
    return false;
  }

  try {
    await Promise.race([
      api.writeText(""),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("probe timeout")), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    // writeText rejected (permission denied, blocked context), threw a non-Error
    // value, or timed out — all indicate the API is unusable right now.
    return false;
  }
}

/**
 * Returns navigator.clipboard when available, null otherwise. Single point of
 * access for the Clipboard API probe — avoids repeating the double-cast pattern
 * used across canCopyToClipboard and copyTextToClipboard's secure-context check.
 */
function getClipboardAPI(): Clipboard | null {
  if (typeof navigator !== "undefined") {
    const nav = navigator as { clipboard?: unknown };
    if (nav.clipboard) {
      return nav.clipboard as Clipboard;
    }
  }
  return null;
}

/**
 * Synchronous probe: returns true if either the modern Clipboard API is available
 * (navigator.clipboard.writeText is a function) or the legacy fallback path could
 * work (document.body exists — execCommand("copy") may still succeed even without
 * navigator.clipboard). Does NOT mutate DOM and does NOT invoke any browser APIs.
 * Safe to call on every render cycle for conditional UI rendering.
 */
export function canCopyToClipboard(): boolean {
  const api = getClipboardAPI();
  if (api && typeof api.writeText === "function") {
    return true;
  }

  // Legacy fallback: needs a document body to create the hidden textarea
  if (typeof document !== "undefined" && document.body) {
    return true;
  }

  return false;
}

export async function copyTextToClipboard(
  clipboard: Pick<Clipboard, "writeText"> | undefined,
  text: string,
  timeoutMs = CLIPBOARD_TIMEOUT_MS,
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
            timer = setTimeout(() => reject(new Error("Clipboard API timed out")), timeoutMs);
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

  return false;
}
