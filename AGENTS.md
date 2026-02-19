# Password Generator

## Purpose

A simple web app that generates 5 cryptographically secure alphanumeric passwords (lengths 23–27) on page load, with a regenerate button and copy-to-clipboard support.

## Tech Stack

- **TypeScript** — source language
- **Vite** — dev server and production bundler (configured with `base: "/password-generator/"` for GitHub Pages)
- **Vitest** — test runner
- **GitHub Actions** — CI/CD pipeline deploying to GitHub Pages via `.github/workflows/deploy.yml`

## Implementation

- `src/password.ts` — core logic: `generatePassword(length)` uses `crypto.getRandomValues()` (Web Crypto API) to pick characters from an alphanumeric charset; `generateAll()` maps over `LENGTHS` [23..27] to produce 5 passwords
- `src/main.ts` — DOM layer: `generate()` builds password rows (length label, password text, copy button) and appends them to `#passwords`; called on page load and on regenerate button click
- `index.html` — single-page UI with inline CSS; loads `main.ts` as an ES module
- `tests/password.test.ts` — unit tests for password length, character set, uniqueness, and `generateAll()` output
