# Lessons Learned

> Maintained by AI agents. Contains validated, reusable insights.
> **Read at the start of every task. Update at the end of every iteration.**

## How to Use This File

### Reading (Start of Every Task)
Read this before writing any code to avoid repeating known mistakes.

### Writing (End of Every Iteration)
If a new reusable insight was gained, add it to the appropriate category.

### Promotion from Iteration Log
Patterns appearing 2+ times in `ITERATION_LOG.md` should be promoted here.

### Pruning
Obsolete lessons → Archive section at bottom (with date and reason). Never delete.

---

## Architecture & Design Decisions

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Code Patterns & Pitfalls

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Testing & Quality

**[2026-05-08] Fresh checkout needs dependencies installed before test runs — On a clean clone in this repo, `npm test` can fail with `vitest: not found` until `npm ci` has populated `node_modules`. Install once before running the suite in unattended jobs.

**[2026-05-05] Vitest pool mode in constrained containers — In low-memory CI/container runs, `vitest run` may fail via fork-worker OOM; `vitest run --pool=threads` is a stable fallback for this repo's test suite.

**[2026-05-10] Reject non-integer password lengths early — `Uint32Array(length)` throws on non-integer lengths; guard with `Number.isInteger(length)` before allocating so utility callers get a safe empty-string result instead of a runtime RangeError.
**[2026-05-12] Invalid password inputs should short-circuit before crypto sampling — zero, negative, non-integer, and empty-charset cases stay deterministic and cheap when the guard returns before `crypto.getRandomValues()`.
**[2026-05-12] Single-character charsets deserve explicit password coverage — a `charset.length === 1` case exercises the no-resample path and guards against accidental over-rejection in custom-charset generators.

## Performance & Infrastructure


<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Dependencies & External Services

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Process & Workflow

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

---

## Archive

<!-- Format: **[YYYY-MM-DD] Archived [YYYY-MM-DD]** Title — Reason for archival -->
