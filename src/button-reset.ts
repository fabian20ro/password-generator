const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

/** Default delay (ms) used when callers omit an explicit `delayMs`. */
export const DEFAULT_RESET_DELAY_MS = 300;

export { resetTimeouts };

/** Cancel any pending reset for the given target. No-op if nothing is scheduled. */
export function cancelButtonReset(target: object): void {
  if (!(target instanceof Object)) throw new TypeError("cancelButtonReset requires an object target");
  const timeoutId = resetTimeouts.get(target);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    resetTimeouts.delete(target);
  }
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

  const timeoutId = setTimeout(() => {
    if (resetTimeouts.get(target) === timeoutId) {
      resetTimeouts.delete(target);
      reset();
    }
  }, delayMs);

  resetTimeouts.set(target, timeoutId);
}
