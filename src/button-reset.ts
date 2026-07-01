const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

export { resetTimeouts };

/** Cancel any pending reset for the given target. No-op if nothing is scheduled. */
export function cancelButtonReset(target: object): void {
  const timeoutId = resetTimeouts.get(target);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    resetTimeouts.delete(target);
  }
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
