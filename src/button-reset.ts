const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

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

export function scheduleButtonReset(target: object, delayMs: number, reset: () => void): void {
  cancelButtonReset(target);

  const timeoutId = setTimeout(() => {
    if (resetTimeouts.get(target) === timeoutId) {
      resetTimeouts.delete(target);
      reset();
    }
  }, delayMs);

  resetTimeouts.set(target, timeoutId);
}
