/** Fallback copy via document.execCommand("copy") for non-modern contexts. */
function fallbackCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return false;
  }

  // Guard against document.body being null/undefined during early DOM lifecycle.
  if (!document.body) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.tabIndex = -1;
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  let success = false;

  try {
    try {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    } catch (e) {
      // selection can fail in some browsers (e.g., off-screen textarea on mobile)
      // but execCommand("copy") may still succeed — proceed anyway.
    }
    success = document.execCommand("copy");
  } catch (err) {
    // ignore — success stays false
  } finally {
    try {
      document.body.removeChild(textarea);
    } catch {}
  }

  return Boolean(success);
}

export const CLIPBOARD_TIMEOUT_MS = 3000;
export const MAX_CLIPBOARD_TEXT_BYTES = 10240; // ~10 KiB upper bound for clipboard payloads

/** Probe: write empty string to Clipboard API, returns false on error/timeout. */
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

/** Returns navigator.clipboard when available, null otherwise. */
function getClipboardAPI(): Clipboard | null {
  return navigator?.clipboard ?? null;
}

/** True if modern Clipboard API or legacy execCommand path is available. No DOM mutation. */
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

  // Reject oversized payloads before invoking the Clipboard API or creating a
  // hidden DOM element. Large writes block on permission prompts and can cause
  // browser hangs — returning early avoids silent failures in fallback paths.
  if (new Blob([text]).size > MAX_CLIPBOARD_TEXT_BYTES) {
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
        await Promise.race([
          clipboard.writeText(text),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Clipboard API timed out")), timeoutMs);
          }),
        ]);
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
