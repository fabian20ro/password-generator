const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

export function scheduleButtonReset(target: object, delayMs: number, reset: () => void): void {
  clearTimeout(resetTimeouts.get(target));

  const timeoutId = setTimeout(() => {
    if (resetTimeouts.get(target) === timeoutId) {
      resetTimeouts.delete(target);
      reset();
    }
  }, delayMs);

  resetTimeouts.set(target, timeoutId);
}
