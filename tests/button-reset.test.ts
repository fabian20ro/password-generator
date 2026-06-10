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

    vi.advanceTimersByTime(1000);
    expect(reset).not.toHaveBeenCalled(); // 1000 + 1000 = 2000 > 1500

    vi.advanceTimersByTime(501);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not call reset if a new timeout has been scheduled", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    
    scheduleButtonReset(target, 1500, reset);
    vi.advanceTimersByTime(1000);
    scheduleButtonReset(target, 500, reset);

    vi.advanceTimersByTime(1000);
    expect(reset).toHaveBeenCalledTimes(1); // The second one should have fired at 2000 (1000 + 1000)
    // Wait, if second was 500, it should fire at 1500 total.
    // The first one was at 1500. 
    // At 1000, we reset. 
    // The second one is at 1000 + 500 = 1500.
    // At 1501, reset should have been called once.
  });
});
