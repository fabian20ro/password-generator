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

### [2026-05-11] Dynamic generated-password status message

**Context:** Small UX polish in the password generator UI.
**What happened:** Replaced the hardcoded "Generated 10 new passwords." status text with a message derived from `LENGTHS.length`, so the announcement stays accurate if the password count changes later. Verified with `npm test` and `npm run build`.
**Outcome:** Success. Behavior unchanged for current output; status text is now future-proofed.
**Insight:** User-facing counts are safer when derived from the same source of truth as the rendered list.
**Promoted to Lessons Learned:** No

---

### [2026-05-11] Negative password-length coverage

**Context:** Tighten boundary coverage around the password generator utility.
**What happened:** Added a test asserting `generatePasswordWithCharset` returns an empty string for negative lengths, matching the function's existing guard for non-positive lengths. Verified with `npm exec vitest run tests/password.test.ts --pool=threads`.
**Outcome:** Success. Behavior unchanged; coverage now documents the negative-length boundary explicitly.
**Insight:** Boundary tests are cheap insurance when the implementation already encodes a broad guard.
**Promoted to Lessons Learned:** No

---

### [2026-05-11] README character-set clarification

**Context:** Keep the public summary aligned with the actual password output details.
**What happened:** Updated the README to say the generator emits alphanumeric passwords and to note that rejection sampling avoids modulo bias.
**Outcome:** Success. The docs now describe the same contract the code and tests already enforce.
**Insight:** User-facing summaries should name the output shape and security-relevant generation detail when those facts are already stable in code.
**Promoted to Lessons Learned:** No

---

### [2026-05-12] Invalid input no-op coverage

**Context:** Tighten boundary coverage around the password generator's early-return guards.
**What happened:** Added a regression test asserting `generatePasswordWithCharset` returns an empty string without sampling crypto for zero, negative, or empty-charset inputs. Verified with a focused Vitest run, then full `npm test` and `npm run build`.
**Outcome:** Success. The guard path is now explicitly covered and stays cheap.
**Insight:** Boundary tests are useful not only for return values but also for proving expensive work is skipped on invalid inputs.
**Promoted to Lessons Learned:** Yes

### [2026-05-12] Single-character charset boundary coverage

**Context:** Add one focused regression around a custom-charset edge case.
**What happened:** Added a Vitest case asserting `generatePasswordWithCharset(8, "X")` returns eight `X` characters and only calls `crypto.getRandomValues()` once, which exercises the no-resample path for a one-character charset. Verified with the focused password test file, the full test suite, and `npm run build`.
**Outcome:** Success. Boundary coverage expanded without changing runtime behavior.
**Insight:** Single-character charsets are a cheap edge case that can catch accidental over-rejection in custom-charset generators.
**Promoted to Lessons Learned:** Yes

---
