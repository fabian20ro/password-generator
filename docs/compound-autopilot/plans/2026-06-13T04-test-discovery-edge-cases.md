# Plan: test-discovery for edge cases in password generator

## Goal
Add unit tests to `tests/password.test.ts` covering edge cases for `generatePasswordWithCharset` and `generateComplexPassword`.

## Context
The current test suite covers basic length and functionality but lacks coverage for:
- Charsets with single characters.
- Charsets with duplicate characters.
- Charsets with non-ASCII/Unicode characters.
- `generateComplexPassword` with edge cases in category composition.

## Implementation Units

### Unit 1: Edge case charsets in `generatePasswordWithCharset`
- **Goal**: Ensure `generatePasswordWithCharset` handles single-char and duplicate-char charsets correctly.
- **Files**: `tests/password.test.ts`
- **Verification**: `npm test -- tests/password.test.ts`
- **Tier**: 1

### Unit 2: Non-ASCII characters
- **Goal**: Verify behavior when charset contains Unicode characters.
- **Files**: `tests/password.test.ts`
- **Verification**: `npm test -- tests/password.test.ts`
- **Tier**: 2

### Unit 3: `generateComplexPassword` empty/edge categories
- **Goal**: Ensure `generateComplexPassword` behaves as expected with categories that contain duplicate characters or special combinations.
- **Files**: `tests/password.test.ts`
- **Verification**: `npm test -- tests/password.test.ts`
- **Tier**: 1
