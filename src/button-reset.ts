const resetTimeouts = new WeakMap<object, ReturnType<typeof setTimeout>>();

export function scheduleButtonReset(target: object, delayMs: number, reset: () => void): void {
  const existing = resetTimeouts.get(target);
  if (existing !== undefined) {
    clearTimeout(existing);
  }

  const timeoutId = setTimeout(() => {
    if (resetTimeouts.get(target) === timeoutId) {
      resetTimeouts.delete(target);
    }
    reset();
  }, delayMs);

  resetTimeouts.set(target, timeoutId);
}
