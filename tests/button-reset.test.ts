import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleButtonReset, cancelButtonReset, isResetScheduled, resetTimeouts } from "../src/button-reset";

describe("scheduleButtonReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isResetScheduled", () => {
    it ("returns false before any schedule call", () => {
      const target = { id: "query-pre" };
      expect(isResetScheduled(target)).toBe(false);
    });

    it ("returns true after scheduling", () => {
      const target = { id: "query-post" };
      const reset = vi.fn();
      scheduleButtonReset(target, 100, reset);
      expect(isResetScheduled(target)).toBe(true);
    });

    it ("returns false after cancellation", () => {
      const target = { id: "query-cancelled" };
      const reset = vi.fn();
      scheduleButtonReset(target, 100, reset);
      cancelButtonReset(target);
      expect(isResetScheduled(target)).toBe(false);
    });

    it ("returns false after the scheduled timer fires", () => {
      const target = { id: "query-fired" };
      const reset = vi.fn();
      scheduleButtonReset(target, 100, reset);
      expect(isResetScheduled(target)).toBe(true);
      vi.advanceTimersByTime(100);
      expect(reset).toHaveBeenCalledTimes(1);
      expect(isResetScheduled(target)).toBe(false);
    });

    it ("returns false for null target", () => {
      expect(isResetScheduled(null as any)).toBe(false);
    });

    it ("returns false for primitive targets", () => {
      expect(isResetScheduled("string" as any)).toBe(false);
      expect(isResetScheduled(42 as any)).toBe(false);
    });

    it ("does not schedule when called on a new target", () => {
      const fresh = { id: "query-fresh" };
      // Ensure the WeakMap is clean for this target.
      expect(resetTimeouts.has(fresh)).toBe(false);
      expect(isResetScheduled(fresh)).toBe(false);

      scheduleButtonReset(fresh, 100, vi.fn());
      expect(isResetScheduled(fresh)).toBe(true);
    });
  });

  it ("calls the reset function after the specified delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 1500, reset);

    vi.advanceTimersByTime(1499);
    expect(reset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("clears the existing timeout if called again before the delay expires", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    
    scheduleButtonReset(target, 1500, reset);
    vi.advanceTimersByTime(1000);
    scheduleButtonReset(target, 1500, reset); // Reschedule

    vi.advanceTimersByTime(2000);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("does not call reset if a new timeout has been scheduled", () => {
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

  it ("works with 0ms delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 0, reset);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("triggers reset in the next tick even with 0ms delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 0, reset);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("handles negative delay as 0", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, -100, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("handles NaN delay as 0", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, NaN, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("handles very long delay", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 1000000, reset);
    vi.advanceTimersByTime(999999);
    expect(reset).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("handles multiple 0ms delays correctly", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 0, reset);
    scheduleButtonReset(target, 0, reset);
    vi.advanceTimersByTime(0);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("works with multiple targets independently", () => {
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

  it ("works correctly if scheduled again after a reset has occurred", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(1);

    scheduleButtonReset(target, 100, reset);
    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(2);
  });

  it ("rapid rescheduling results in only the final callback firing at its correct time", () => {
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

  it ("suppresses stale callbacks when rescheduled with different closures", () => {
    const target = { id: "stale-test" };
    const r1 = vi.fn(); // 500ms — would fire at t=500
    const r2 = vi.fn(); // 400ms — rescheduled at t=200, fires at t=600

    scheduleButtonReset(target, 500, r1);
    vi.advanceTimersByTime(200);
    scheduleButtonReset(target, 400, r2); // overrides r1's timeout

    vi.advanceTimersByTime(399);
    expect(r1).not.toHaveBeenCalled(); // not yet due for r2
    expect(r2).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(r2).toHaveBeenCalledTimes(1);
    expect(r1).not.toHaveBeenCalled(); // stale closure suppressed by identity check
  });

  it ("throws error when target is null", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset(null as any, 100, reset)).toThrow();
  });

  it ("throws error when target is a primitive", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset("string" as any, 100, reset)).toThrow();
  });

  it ("ensures cleanup occurs even if the reset function throws", () => {
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

  it ("does not throw when clearing an undefined timeout (first call on a new target)", () => {
    const target = { id: "fresh" };
    const reset = vi.fn();

    // First call — WeakMap has no entry, so clearTimeout(undefined) is invoked.
    // Node's setTimeout polyfill rejects non-number values; the function must guard against this.
    scheduleButtonReset(target, 100, reset);
    expect(() => {}).not.toThrow();
    vi.advanceTimersByTime(100);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("does not fire a stale callback when the timeout is rescheduled before expiry", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    const firstTimeoutId = resetTimeouts.get(target);
    expect(firstTimeoutId).toBeDefined();

    // Advance to the original delay — but before firing, reschedule.
    vi.advanceTimersByTime(50);
    scheduleButtonReset(target, 50, reset);

    // The second timeout fires at t=100; verify it runs exactly once.
    vi.advanceTimersByTime(60);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("removes the WeakMap entry after a successful reset fires", () => {
    const target = { id: "test" };
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    expect(resetTimeouts.has(target)).toBe(true);

    vi.advanceTimersByTime(100);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(resetTimeouts.has(target)).toBe(false);
  });
});

describe("cancelButtonReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it ("does nothing when no timeout is scheduled", () => {
    const target = { id: "empty" };
    expect(() => cancelButtonReset(target)).not.toThrow();
  });

  it ("clears the pending reset so the callback never fires", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 100, reset);

    cancelButtonReset(target);
    expect(resetTimeouts.has(target)).toBe(false);

    vi.advanceTimersByTime(200);
    expect(reset).not.toHaveBeenCalled();
  });

  it ("allows a fresh schedule to work after cancel", () => {
    const target = { id: "test" };
    const reset = vi.fn();
    scheduleButtonReset(target, 100, reset);
    cancelButtonReset(target);

    scheduleButtonReset(target, 100, reset);
    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("does not affect a different target's timeout", () => {
    const t1 = { id: "a" };
    const t2 = { id: "b" };
    const r1 = vi.fn();
    const r2 = vi.fn();
    scheduleButtonReset(t1, 100, r1);
    scheduleButtonReset(t2, 50, r2);

    cancelButtonReset(t1);
    vi.advanceTimersByTime(60);
    expect(r1).not.toHaveBeenCalled();
    expect(r2).toHaveBeenCalledTimes(1);
  });

  it ("leaves no stale WeakMap entries when called on a fresh target", () => {
    const fresh = { id: "fresh-target" };
    // Ensure the WeakMap starts clean for this target.
    expect(resetTimeouts.has(fresh)).toBe(false);

    cancelButtonReset(fresh);
    expect(resetTimeouts.has(fresh)).toBe(false);
  });

  it ("cleans up the WeakMap entry during cancel", () => {
    const target = { id: "cleanup-target" };
    scheduleButtonReset(target, 100, vi.fn());
    expect(resetTimeouts.has(target)).toBe(true);

    cancelButtonReset(target);
    expect(resetTimeouts.has(target)).toBe(false);
  });

  it ("throws error when target is null", () => {
    const reset = vi.fn();
    scheduleButtonReset({ id: "pre" }, 100, reset); // populate WeakMap first
    expect(() => cancelButtonReset(null as any)).toThrow();
  });

  it ("throws error when target is a primitive string", () => {
    const reset = vi.fn();
    scheduleButtonReset({ id: "pre2" }, 100, reset); // populate WeakMap first
    expect(() => cancelButtonReset("string-key" as any)).toThrow();
  });

  it ("is safe to call repeatedly on the same target", () => {
    const target = { id: "double-cancel" };
    scheduleButtonReset(target, 100, vi.fn());

    cancelButtonReset(target);
    expect(() => cancelButtonReset(target)).not.toThrow();
  });

  it ("does not throw when called after the reset has fired naturally", () => {
    const target = { id: "post-fire-cancel" };
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    expect(resetTimeouts.has(target)).toBe(true);

    vi.advanceTimersByTime(100);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(resetTimeouts.has(target)).toBe(false);

    // Cancel must be a no-op after natural expiry — not throw.
    expect(() => cancelButtonReset(target)).not.toThrow();

    // Reschedule after cancel must work cleanly.
    const reset2 = vi.fn();
    scheduleButtonReset(target, 100, reset2);
    vi.advanceTimersByTime(150);
    expect(reset2).toHaveBeenCalledTimes(1);
  });
});
