# Password Generator

[![Deploy to GitHub Pages](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml)

**[Live Site](https://fabian20ro.github.io/password-generator/)** 

Simple password generator that creates 10 cryptographically secure alphanumeric passwords (23–32 characters).

Uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) (`crypto.getRandomValues()`) — the browser's built-in CSPRNG, equivalent to Java's `SecureRandom`.
Password characters are sampled with rejection sampling to avoid modulo bias.
Each generated password includes a copy button with success/failure feedback. A Regenerate button refreshes the full list and updates the status message. Status updates are mirrored to a screen-reader live region. The footer links to the deployment workflow status.
