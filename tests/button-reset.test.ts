import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleButtonReset } from "../src/button-reset";

describe("scheduleButtonReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the reset function after the specified delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 1500, reset);

    vi.advanceTimersByTime(1499);
    expect(reset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("clears the existing timeout if called again before the delay expires", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    
    scheduleButtonReset(target, 1500, reset);
    vi.advanceTimersByTime(1000);
    scheduleButtonReset(target, 1500, reset); // Reschedule

    vi.advanceTimersByTime(2000);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not call reset if a new timeout has been scheduled", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 1500, reset);
    vi.advanceTimersByTime(1000);
    scheduleButtonReset(target, 500, reset);

    // At 2000ms total elapsed:
    // 1st timeout (1500ms) was cleared at 1000ms.
    // 2nd timeout (500ms) should trigger at 1000 + 500 = 1500ms.
    vi.advanceTimersByTime(1000);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("works with 0ms delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 0, reset);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("triggers reset in the next tick even with 0ms delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 0, reset);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("handles negative delay as 0", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, -100, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("handles NaN delay as 0", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, NaN, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("handles very long delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 1000000, reset);
    vi.advanceTimersByTime(999999);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("handles multiple 0ms delays correctly", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 0, reset);
    scheduleButtonReset(target, 0, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("works with multiple targets independently", () => {
    const target = { id: "test" };
    const target2 = { id: "test2" };
    const reset1 = vi.fn();
    const reset2 = vi.fn();

    scheduleButtonReset(target, 1000, reset1);
    scheduleButtonReset(target2, 500, reset2);

    vi.advanceTimersByTime(600);
    expect(reset2).toHaveBeenCalledTimes(1);
    expect(reset1).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(reset1).toHaveBeenCalledTimes(1);
  });

  it("works correctly if scheduled again after a reset has occurred", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(1);

    scheduleButtonReset(target, 100, reset);
    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(2);
  });

  it("rapid rescheduling results in only the final callback firing at its correct time", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 1000, reset); // fires at t=1000
    scheduleButtonReset(target, 800, reset);  // fires at t=800 (overrides)
    scheduleButtonReset(target, 500, reset);  // fires at t=500 (overrides)

    vi.advanceTimersByTime(499);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("throws error when target is null", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset(null as any, 100, reset)).toThrow();
  });

  it("throws error when target is a primitive", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset("string" as any, 100, reset)).toThrow();
  });

  it("ensures cleanup occurs even if the reset function throws", () => {
    const target = { id: "test" };
    const reset = vi.fn(() => {
      throw new Error("reset error");
    });

    scheduleButtonReset(target, 100, reset);

    try {
      vi.advanceTimersByTime(100);
    } catch (e) {
      // expected
    }

    const reset2 = vi.fn();
    scheduleButtonReset(target, 100, reset2);
    vi.advanceTimersByTime(100);
    expect(reset2).toHaveBeenCalled();
  });
});
