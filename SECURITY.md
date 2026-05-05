# Security Policy

## Supported Versions

This project is actively maintained on the default branch.

| Version | Supported |
| ------- | --------- |
| `main`  | ✅ Yes |
| Older snapshots / forks | ❌ No |

## Reporting a Vulnerability

Please report security issues privately using one of these channels:

1. **Preferred:** GitHub Security Advisories (private report in this repository).
2. **Fallback:** Open a GitHub issue and include only non-sensitive details, then request a private follow-up.

Do **not** publish proof-of-concept exploit details in public issues before maintainers acknowledge the report.

## Response Expectations

- **Initial acknowledgment:** within 7 calendar days.
- **Triage status update:** within 14 calendar days.
- **Fix timeline:** depends on severity and maintainer availability; high-severity issues are prioritized.

## Scope Notes

This is a client-side password generator using browser Web Crypto (`crypto.getRandomValues`). Security reports are most useful when they involve:

- randomness quality or bias introduction,
- unsafe password handling in UI/copy flow,
- CSP or deployment changes that weaken security boundaries,
- build/deploy artifacts that alter trusted runtime behavior.

Reports about third-party browser bugs should include browser/version details and a minimal reproduction.
