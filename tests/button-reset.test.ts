import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { scheduleButtonReset } from "../src/button-reset";

describe("scheduleButtonReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
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

  it("cancels the previous reset when the same target is scheduled again", () => {
    const target = {};
    const reset = vi.fn();

    scheduleButtonReset(target, 2000, reset);
    scheduleButtonReset(target, 1000, reset);

    vi.advanceTimersByTime(1000);
    expect(reset).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
