const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

/** Default delay (ms) used when callers omit an explicit `delayMs`. */
export const DEFAULT_RESET_DELAY_MS = 300;

export { resetTimeouts };

/** Cancel any pending reset for the given target. Returns true if a scheduled
 *  timeout was actually cleared, false if nothing was pending (no-op). No-op
 *  targets do NOT throw; they just report their empty state via return value. */
export function cancelButtonReset(target: object): boolean {
  if (!(target instanceof Object)) throw new TypeError("cancelButtonReset requires an object target");
  const timeoutId = resetTimeouts.get(target);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    resetTimeouts.delete(target);
    return true;
  }
  return false;
}

/** Returns true if a reset has been scheduled for the target and not yet cancelled or fired. */
export function isResetScheduled(target: object): boolean {
  return target instanceof Object && resetTimeouts.has(target);
}

/** Schedule a delayed reset callback for the given target.
 *  Cancels any prior pending reset first (idempotent).
 *  The `reset` closure fires exactly once at or after `delayMs`.
 *  Rescheduling before expiry replaces the pending callback with the new one;
 *  stale closures from earlier schedules are suppressed via timeout-id identity.
 *  Throws if `target` is not an object (null, primitive, undefined). */
export function scheduleButtonReset(
  target: object,
  delayMs = DEFAULT_RESET_DELAY_MS,
  reset: () => void,
): void {
  cancelButtonReset(target);

  // Reject a missing or non-callable reset callback — a stale schedule with no
  // handler would fire and silently throw on `reset()`, crashing the page.
  if (typeof reset !== "function") {
    return;
  }

  // Coerce null/undefined to the documented default; NaN → clamp to 0.
  const effectiveDelay = (delayMs === null || delayMs === undefined)
    ? DEFAULT_RESET_DELAY_MS
    : Number.isNaN(delayMs) ? 0 : Math.max(0, delayMs);

  const timeoutId = setTimeout(() => {
    if (resetTimeouts.get(target) === timeoutId) {
      resetTimeouts.delete(target);
      reset();
    }
  }, effectiveDelay);

  resetTimeouts.set(target, timeoutId);
}
