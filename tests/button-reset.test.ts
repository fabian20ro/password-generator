import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { scheduleButtonReset } from "../src/button-reset";

const pendingTimeouts = new Map<number, () => void>();
let nextTimeoutId = 1;

function installManualTimeouts(): void {
  pendingTimeouts.clear();
  nextTimeoutId = 1;

  vi.stubGlobal("setTimeout", ((callback: () => void) => {
    const timeoutId = nextTimeoutId++;
    pendingTimeouts.set(timeoutId, callback);
    return timeoutId;
  }) as typeof setTimeout);

  vi.stubGlobal("clearTimeout", ((timeoutId: number) => {
    pendingTimeouts.delete(timeoutId);
  }) as typeof clearTimeout);
}

function runTimeout(timeoutId: number): void {
  pendingTimeouts.get(timeoutId)?.();
}

describe("scheduleButtonReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    pendingTimeouts.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("runs the reset callback after the requested delay", () => {
    const target = {};
    const reset = vi.fn();

    scheduleButtonReset(target, 1500, reset);

    vi.advanceTimersByTime(1499);
    expect(reset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale timeout callback after the target has been rescheduled", () => {
    installManualTimeouts();

    const target = {};
    const reset = vi.fn();

    scheduleButtonReset(target, 2000, reset);
    scheduleButtonReset(target, 1000, reset);

    runTimeout(1);
    expect(reset).not.toHaveBeenCalled();

    runTimeout(2);
    expect(reset).toHaveBeenCalledTimes(1);
  });

});
