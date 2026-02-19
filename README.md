# Password Generator

[![Deploy to GitHub Pages](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/fabian20ro/password-generator/actions/workflows/deploy.yml)

**[Live Site](https://fabian20ro.github.io/password-generator/)** 

Simple password generator that creates 5 cryptographically secure passwords (23–27 characters).

Uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) (`crypto.getRandomValues()`) — the browser's built-in CSPRNG, equivalent to Java's `SecureRandom`.
