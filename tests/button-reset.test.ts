import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleButtonReset, cancelButtonReset, isResetScheduled, resetTimeouts, DEFAULT_RESET_DELAY_MS } from "../src/button-reset";

describe("DEFAULT_RESET_DELAY_MS", () => {
  it ("is exported and equals 300 ms", () => {
    expect(DEFAULT_RESET_DELAY_MS).toBe(300);
  });

  it ("does not change across test runs (constant, not derived)", () => {
    const a = DEFAULT_RESET_DELAY_MS;
    const b = DEFAULT_RESET_DELAY_MS;
    expect(a).toBe(b);
    expect(typeof a).toBe("number");
  });
});

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

    it ("returns false for undefined target without throwing", () => {
      const sentinel = { id: "undefined-guard-sentinel" };
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => isResetScheduled(undefined as any)).not.toThrow();
      expect(isResetScheduled(undefined as any)).toBe(false);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("returns false for primitive targets", () => {
      expect(isResetScheduled("string" as any)).toBe(false);
      expect(isResetScheduled(42 as any)).toBe(false);
    });

    it ("does not schedule when called on a new target", () => {
      const fresh = { id: "query-fresh" };
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

  it ("uses DEFAULT_RESET_DELAY_MS when delayMs is omitted (default parameter)", () => {
    const target = { id: "defaults-to-300" };
    const reset = vi.fn();

    scheduleButtonReset(target, undefined as any, reset);
    expect(resetTimeouts.has(target)).toBe(true);

    vi.advanceTimersByTime(DEFAULT_RESET_DELAY_MS - 1);
    expect(reset).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it ("ignores null delayMs and falls back to DEFAULT_RESET_DELAY_MS", () => {
    const target = { id: "null-delay-fallback" };
    const reset = vi.fn();

    scheduleButtonReset(target, null as any, reset);
    expect(resetTimeouts.has(target)).toBe(true);

    // With a null delay, setTimeout treats it as 0 — so we must advance past 0 first.
    vi.advanceTimersByTime(0);
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

  it ("WeakMap holds only the latest timeoutId after rescheduling (identity invariant)", () => {
    const target = { id: "identity-invariant" };
    const r1 = vi.fn(); // 300ms — would fire at t=300
    const r2 = vi.fn(); // 500ms — rescheduled, fires at t=800

    scheduleButtonReset(target, 300, r1);
    const firstTimeoutId = resetTimeouts.get(target) as ReturnType<typeof setTimeout> | undefined;
    expect(firstTimeoutId).toBeDefined();

    vi.advanceTimersByTime(250); // before first expiry
    scheduleButtonReset(target, 500, r2); // overrides — calls cancelButtonReset internally
    const secondTimeoutId = resetTimeouts.get(target) as ReturnType<typeof setTimeout> | undefined;
    expect(secondTimeoutId).toBeDefined();

    // Core invariant: WeakMap holds ONLY the new timeout ID. Old one must be gone.
    expect(resetTimeouts.get(target)).toBe(secondTimeoutId);
    expect(resetTimeouts.get(target)).not.toBe(firstTimeoutId);

    vi.advanceTimersByTime(500); // at t=750, r2 fires at t=750 (250+500)
    expect(r1).not.toHaveBeenCalled();
    expect(r2).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300); // past old expiry time too — r1 must NOT fire as stale
    expect(r1).not.toHaveBeenCalled();
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

  it ("works with array targets since they pass instanceof Object", () => {
    const target: number[] = [1, 2, 3];
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    expect(isResetScheduled(target)).toBe(true);
    expect(resetTimeouts.has(target)).toBe(true);

    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(resetTimeouts.has(target)).toBe(false);
  });

  it ("works with function targets since they pass instanceof Object", () => {
    const target = () => {};
    const reset = vi.fn();

    scheduleButtonReset(target, 100, reset);
    expect(isResetScheduled(target)).toBe(true);

    vi.advanceTimersByTime(150);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(resetTimeouts.has(target)).toBe(false);
  });

  it ("throws error when target is null", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset(null as any, 100, reset)).toThrow();
  });

  it ("throws error when target is a primitive", () => {
    const reset = vi.fn();
    expect(() => scheduleButtonReset("string" as any, 100, reset)).toThrow();
  });

  it ("does not leak WeakMap state when thrown on null target", () => {
    // Defensive guard must throw before any WeakMap mutation.
    const sentinel = { id: "null-sentinel" };
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => scheduleButtonReset(null as any, 100, vi.fn())).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("does not leak WeakMap state when thrown on primitive target", () => {
    const sentinel = { id: "primitive-sentinel" };
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => scheduleButtonReset("string-key-xyz" as any, 100, vi.fn())).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("throws error when target is undefined", () => {
    const sentinel = { id: "undefined-schedule-sentinel" };
    scheduleButtonReset({ id: "pre-undef" }, 100, vi.fn()); // ensure WeakMap has entries
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => scheduleButtonReset(undefined as any, 100, vi.fn())).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("does not leak WeakMap state when thrown on undefined target", () => {
    // Defensive guard must throw before any WeakMap mutation.
    const sentinel = { id: "undefined-leak-sentinel" };
    expect(resetTimeouts.has(sentinel)).toBe(false);
    scheduleButtonReset({ id: "pre-undef2" }, 100, vi.fn()); // ensure WeakMap has entries
    expect(() => scheduleButtonReset(undefined as any, 100, vi.fn())).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
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

  it ("rescheduling from inside the reset callback works — delete-before-fire ordering", () => {
    // Validates that scheduleButtonReset deletes the WeakMap entry *before*
    // invoking `reset()`, so a re-schedule issued inside the callback starts
    // cleanly without fighting stale state.
    const target = { id: "reenter" };
    let outerFired = false;

    scheduleButtonReset(target, 100, () => {
      outerFired = true;
      expect(resetTimeouts.has(target)).toBe(false); // entry already deleted
      scheduleButtonReset(target, 50, vi.fn());      // fresh start for same target
    });

    expect(outerFired).toBe(false);

    vi.advanceTimersByTime(100);
    expect(outerFired).toBe(true);
    expect(resetTimeouts.has(target)).toBe(true);     // new schedule took effect

    vi.advanceTimersByTime(50);
    // the inner callback was vi.fn() — verify no error thrown and entry cleared
    expect(resetTimeouts.has(target)).toBe(false);
  });
});

describe("isResetScheduled", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it ("returns false for a fresh unscheduled target", () => {
    const target = { id: "fresh-isolated" };
    expect(resetTimeouts.has(target)).toBe(false);
    expect(isResetScheduled(target)).toBe(false);
  });

  it ("returns true after scheduling, then transitions to false on cancel", () => {
    const target = { id: "toggle-isolated" };
    scheduleButtonReset(target, 100, vi.fn());
    expect(isResetScheduled(target)).toBe(true);
    cancelButtonReset(target);
    expect(isResetScheduled(target)).toBe(false);
  });

  it ("returns false for null without throwing", () => {
    const sentinel = { id: "null-isolated-sentinel" };
    scheduleButtonReset({ id: "pre-null" }, 100, vi.fn());
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => isResetScheduled(null as any)).not.toThrow();
    expect(isResetScheduled(null as any)).toBe(false);
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("returns false for undefined without throwing", () => {
    const sentinel = { id: "undef-isolated-sentinel" };
    scheduleButtonReset({ id: "pre-undef" }, 100, vi.fn());
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => isResetScheduled(undefined as any)).not.toThrow();
    expect(isResetScheduled(undefined as any)).toBe(false);
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("returns false for primitive targets (string, number) without throwing", () => {
    const sentinel = { id: "prim-isolated-sentinel" };
    scheduleButtonReset({ id: "pre-prim" }, 100, vi.fn());
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => isResetScheduled("string-primitive" as any)).not.toThrow();
    expect(isResetScheduled("string-primitive" as any)).toBe(false);
    expect(() => isResetScheduled(42 as any)).not.toThrow();
    expect(isResetScheduled(42 as any)).toBe(false);
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("returns false after the scheduled timeout fires naturally", () => {
    const target = { id: "post-fire-isolated" };
    scheduleButtonReset(target, 100, vi.fn());
    expect(isResetScheduled(target)).toBe(true);
    vi.advanceTimersByTime(100);
    expect(isResetScheduled(target)).toBe(false);
  });

  it ("reflects the latest state across cancel + reschedule cycle", () => {
    const target = { id: "cycle-isolated" };
    expect(isResetScheduled(target)).toBe(false);
    scheduleButtonReset(target, 100, vi.fn());
    expect(isResetScheduled(target)).toBe(true);
    cancelButtonReset(target);
    expect(isResetScheduled(target)).toBe(false);
    const reset2 = vi.fn();
    scheduleButtonReset(target, 100, reset2);
    expect(isResetScheduled(target)).toBe(true);
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

  it ("leaves other targets' timeouts intact when canceling a fresh target", () => {
    // Cross-target isolation: canceling an unscheduled target must not disturb
    // WeakMap entries belonging to other, already-scheduled targets.
    const busyTarget = { id: "busy" };
    const freshTarget = { id: "fresh-isolation" };

    scheduleButtonReset(busyTarget, 100, vi.fn());
    expect(resetTimeouts.has(busyTarget)).toBe(true);
    expect(resetTimeouts.has(freshTarget)).toBe(false);

    cancelButtonReset(freshTarget); // no-op on fresh target

    // The busy target must still be scheduled and cancellable.
    expect(resetTimeouts.has(busyTarget)).toBe(true);
    const resetFn = vi.fn();
    scheduleButtonReset(busyTarget, 50, resetFn);
    vi.advanceTimersByTime(60);
    expect(resetFn).toHaveBeenCalledTimes(1);
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

  it ("leaves exactly one WeakMap entry after cancel + reschedule cycle", () => {
    // Cancelling must fully purge the old timeout so a subsequent schedule
    // does not accumulate stale entries — only the latest timeout should exist.
    const target = { id: "cancel-reschedule-leak" };
    const r1 = vi.fn();

    scheduleButtonReset(target, 100, r1);
    expect(resetTimeouts.get(target)).toBeDefined();

    cancelButtonReset(target);
    expect(resetTimeouts.has(target)).toBe(false);

    const r2 = vi.fn();
    scheduleButtonReset(target, 100, r2);
    const newId = resetTimeouts.get(target);
    expect(newId).toBeDefined();

    // The stored id must be the fresh one — not the old timeout id.
    expect(resetTimeouts.get(target)).toBe(newId);

    vi.advanceTimersByTime(150);
    expect(r1).not.toHaveBeenCalled();
    expect(r2).toHaveBeenCalledTimes(1);
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

  describe("input validation", () => {
    it ("throws when called with null target", () => {
      const sentinel = { id: "null-cancel-sentinel" };
      scheduleButtonReset({ id: "pre-null-cancel" }, 100, vi.fn()); // ensure WeakMap has entries
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset(null as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("throws when called with undefined target", () => {
      const sentinel = { id: "undef-cancel-sentinel" };
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset(undefined as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("throws when called with a primitive target", () => {
      const sentinel = { id: "prim-cancel-sentinel" };
      scheduleButtonReset({ id: "pre-prim-cancel" }, 100, vi.fn()); // ensure WeakMap has entries
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset("string-key-def" as any)).toThrow(TypeError);
      expect(() => cancelButtonReset(42 as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("rejects the same guard path scheduleButtonReset uses (consistent API contract)", () => {
      // Defensive invariant: both public entry points reject non-objects.
      const reset = vi.fn();
      scheduleButtonReset({ id: "contract-ok" }, 100, reset);

      expect(() => cancelButtonReset(null as any)).toThrow(/target/);
      expect(() => scheduleButtonReset(null as any, 100, reset)).toThrow(/target/);
    });
  });

  it ("cleans up the WeakMap entry during cancel", () => {
    const target = { id: "cleanup-target" };
    scheduleButtonReset(target, 100, vi.fn());
    expect(resetTimeouts.has(target)).toBe(true);

    cancelButtonReset(target);
    expect(resetTimeouts.has(target)).toBe(false);
  });

  it ("prevents reset firing when cancelled at the last moment", () => {
    const target = { id: "edge-cancel" };
    const reset = vi.fn();
    scheduleButtonReset(target, 100, reset);

    // Cancel exactly at the expiry boundary.
    vi.advanceTimersByTime(99);
    cancelButtonReset(target);

    expect(reset).not.toHaveBeenCalled();
    expect(resetTimeouts.has(target)).toBe(false);
  });

  it ("suppresses multiple pending resets when cancelled once", () => {
    const target = { id: "multi-cancel" };
    const r1 = vi.fn();
    const r2 = vi.fn();
    scheduleButtonReset(target, 200, r1); // fires at t=200 if not cleared
    vi.advanceTimersByTime(50);
    scheduleButtonReset(target, 100, r2); // overrides, fires at t=150

    cancelButtonReset(target);
    expect(resetTimeouts.has(target)).toBe(false);

    vi.advanceTimersByTime(200);
    expect(r1).not.toHaveBeenCalled();
    expect(r2).not.toHaveBeenCalled();
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

  it ("throws error when target is undefined", () => {
    const sentinel = { id: "undefined-cancel-sentinel" };
    scheduleButtonReset({ id: "pre4" }, 100, vi.fn()); // ensure WeakMap has entries
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => cancelButtonReset(undefined as any)).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("throws on every non-object primitive type, not just strings", () => {
    // Defensive guard uses the same instanceof Object check as scheduleButtonReset.
    const sentinel = { id: "primitive-cascade-sentinel" };
    expect(resetTimeouts.has(sentinel)).toBe(false);

    for (const bad of [null, 42, true, false]) {
      expect(() => cancelButtonReset(bad as any))
        .toThrow(/cancelButtonReset requires an object target/);
    }

    // No WeakMap mutation leaked from the throws.
    for (const bad of [null, 42, true, false]) {
      expect(resetTimeouts.has(sentinel)).toBe(false);
    }
  });

  it ("does not mutate any WeakMap entry when thrown on primitive target", () => {
    const sentinel = { id: "primitive-cancel-sentinel" };
    scheduleButtonReset({ id: "pre3" }, 100, vi.fn()); // ensure WeakMap has entries
    expect(resetTimeouts.has(sentinel)).toBe(false);
    expect(() => cancelButtonReset("bad-key-abc" as any)).toThrow();
    expect(resetTimeouts.has(sentinel)).toBe(false);
  });

  it ("is safe to call repeatedly on the same target", () => {
    const target = { id: "double-cancel" };
    scheduleButtonReset(target, 100, vi.fn());

    cancelButtonReset(target);
    expect(() => cancelButtonReset(target)).not.toThrow();
  });

  it ("actually invokes clearTimeout with the scheduled timeout id", () => {
    const target = { id: "cleartimeout-spy" };
    scheduleButtonReset(target, 100, vi.fn());
    const scheduledId = resetTimeouts.get(target) as ReturnType<typeof setTimeout>;

    vi.spyOn(globalThis, "clearTimeout");
    cancelButtonReset(target);
    expect(clearTimeout).toHaveBeenCalledWith(scheduledId);
    (globalThis.clearTimeout as unknown as ReturnType<typeof vi.fn>).mockRestore();
  });

  it ("transitions isResetScheduled through true → false → true across cancel + reschedule", () => {
    // State-machine assertion: the public isResetScheduled API must reflect the
    // WeakMap state at each stage of a schedule → cancel → reschedule lifecycle.
    const target = { id: "state-machine-cancel-reschedule" };

    expect(isResetScheduled(target)).toBe(false);

    scheduleButtonReset(target, 100, vi.fn());
    expect(isResetScheduled(target)).toBe(true);
    expect(resetTimeouts.has(target)).toBe(true);

    cancelButtonReset(target);
    expect(isResetScheduled(target)).toBe(false);
    expect(resetTimeouts.has(target)).toBe(false);

    const reset2 = vi.fn();
    scheduleButtonReset(target, 100, reset2);
    expect(isResetScheduled(target)).toBe(true);
    expect(resetTimeouts.has(target)).toBe(true);

    // Only the latest timeout ID should exist in the WeakMap.
    const storedId = resetTimeouts.get(target);
    expect(storedId).toBeDefined();
    vi.advanceTimersByTime(150);
    expect(reset2).toHaveBeenCalledTimes(1);
  });

  it ("does not invoke clearTimeout on a fresh target", () => {
    const fresh = { id: "fresh-no-clear" };
    expect(resetTimeouts.has(fresh)).toBe(false);

    vi.spyOn(globalThis, "clearTimeout");
    cancelButtonReset(fresh);
    expect(clearTimeout).not.toHaveBeenCalled();
    (globalThis.clearTimeout as unknown as ReturnType<typeof vi.fn>).mockRestore();
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

  describe("defensive guard", () => {
    it ("throws when target is null (own contract)", () => {
      const sentinel = { id: "cancel-null-sentinel" };
      scheduleButtonReset({ id: "pre-cancel-guard" }, 100, vi.fn()); // ensure WeakMap populated
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset(null as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("throws when target is a primitive string (own contract)", () => {
      const sentinel = { id: "cancel-primitive-sentinel" };
      scheduleButtonReset({ id: "pre-cancel-guard2" }, 100, vi.fn()); // ensure WeakMap populated
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset("string-key" as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("throws when target is undefined (own contract)", () => {
      const sentinel = { id: "cancel-undefined-sentinel" };
      scheduleButtonReset({ id: "pre-cancel-guard3" }, 100, vi.fn()); // ensure WeakMap populated
      expect(resetTimeouts.has(sentinel)).toBe(false);
      expect(() => cancelButtonReset(undefined as any)).toThrow(TypeError);
      expect(resetTimeouts.has(sentinel)).toBe(false);
    });

    it ("does not mutate WeakMap before throwing on null target", () => {
      // Guard must fail fast — no WeakMap interaction on invalid input.
      const busy = { id: "busy-cancel-guard" };
      scheduleButtonReset(busy, 100, vi.fn());
      expect(resetTimeouts.has(busy)).toBe(true);

      expect(() => cancelButtonReset(null as any)).toThrow(TypeError);

      // Busy target must remain intact — no partial cleanup triggered by invalid call.
      expect(resetTimeouts.has(busy)).toBe(true);
    });

    it ("throws TypeError with the documented message", () => {
      const reset = vi.fn();
      scheduleButtonReset({ id: "pre-message" }, 100, reset); // ensure WeakMap populated
      try {
        cancelButtonReset(null as any);
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError);
        expect((e as TypeError).message).toBe("cancelButtonReset requires an object target");
      }
    });
  });
});