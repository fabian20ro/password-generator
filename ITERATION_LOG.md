# Iteration Log

> Append-only journal of AI agent work sessions.
> **Add an entry at the end of every iteration.**
> Same issue 2+ times? Promote to `LESSONS_LEARNED.md`.

## Entry Format

---

### [YYYY-MM-DD] Brief Description

**Context:** What was the goal
**What happened:** Key actions, decisions
**Outcome:** Success / partial / failure
**Insight:** (optional) What would you tell the next agent?
**Promoted to Lessons Learned:** Yes / No

---

### [2026-03-17] Periodic Maintenance — First Audit

**Context:** First periodic maintenance run on AI agent config system.
**What happened:** Full 5-phase audit per SETUP_AI_AGENT_CONFIG.md protocol. AGENTS.md condensed: removed discoverable details (full CSP string, base path value), removed "README is stale" (flagged as codebase fix), added telegraph style header. agent-creator.md updated to list itself in Existing Agents. LESSONS_LEARNED and ITERATION_LOG had no entries to process.
**Outcome:** Success. AGENTS.md reduced from 52 to 42 lines. All cross-file consistency checks pass.
**Insight:** README.md is stale (says "5 passwords 23-27" but code generates 10 passwords 23-32). Should be fixed in codebase, not tracked in AGENTS.md.
**Promoted to Lessons Learned:** No

---


### [2026-05-05] Repo hardening + UX accessibility + docs alignment

**Context:** Implement full quality plan from repo review (README accuracy, CSP tightening, accessibility, test resilience, security policy).
**What happened:** Updated README to match actual output sizes. Replaced template SECURITY.md with actionable policy. Removed external badge image dependency and tightened CSP img-src to 'self'. Added status/live-region announcements and better button accessibility in UI. Refactored tests to explicitly mock Web Crypto and keep rejection-sampling validation deterministic.
**Outcome:** Success. Build passes and tests pass with thread pool in current environment.
**Insight:** Vitest default worker/fork mode can OOM in constrained containers; thread pool flag stabilizes execution without changing production code.
**Promoted to Lessons Learned:** Yes

---

### [2026-05-08] Clipboard fallback hardening

**Context:** Improve password-generator copy flow with a low-risk usability fix.
**What happened:** Added a small clipboard helper, taught the UI to treat missing clipboard support the same as a clipboard failure, and added focused unit coverage for success/failure/unavailable cases. Initial `npm test` failed because `vitest` was not installed in the fresh checkout; ran `npm ci` once, then reran tests and build successfully.
**Outcome:** Success. UI behavior hardened, tests and build pass.
**Insight:** Fresh checkouts in this repo may need `npm ci` before the first test run.
**Promoted to Lessons Learned:** Yes

---

### [2026-05-10] Password length validation hardening

**Context:** Small correctness improvement in the password utility.
**What happened:** Tightened `generatePasswordWithCharset` to reject non-integer lengths before allocating a `Uint32Array`, added a focused test for `NaN`/fractional/infinite lengths, and verified with `npm test` and `npm run build`.
**Outcome:** Success. Valid inputs unchanged; invalid lengths now fail safely with an empty string instead of a runtime range error.
**Insight:** Guarding numeric inputs early keeps utility functions predictable and easier to reuse.
**Promoted to Lessons Learned:** Yes

---

<!-- New entries above this line, most recent first -->
