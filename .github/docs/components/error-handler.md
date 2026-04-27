# Component: ErrorHandler

## Identity

- **Type:** library module (static utility class)
- **Location:** `js/copy-service/ErrorHandler/ErrorHandler.ts`
- **Architecture role:** shared platform — centralized error handling
- **Boundaries:** Does NOT know about any other component. All components call it for error reporting.

## Purpose

ErrorHandler provides a single, consistent mechanism for error reporting across the entire library. It exists because errors must behave differently depending on context: halting errors throw (for parse failures where continuing would produce corrupt output), while non-halting errors log to console in development (for missing substitutions where showing empty text is preferable to crashing).

## Responsibilities

- Throws errors when `halt: true` (parse failures, invalid syntax)
- Logs errors to console in development mode when `halt: false` (missing keys, missing substitutions)
- Silences all non-halting errors in production and test environments
- Provides `isInDevMode()` check

## Who Calls It

| Component | Error Cases | Halt? |
|-----------|------------|-------|
| CopyService | Wrong format, missing keys | No (usually) |
| IntlCopyService | Unknown language, missing keys across hierarchy | No (usually) |
| Parser | Invalid syntax, unexpected tokens | Yes (always) |
| Evaluator subclasses | Unknown node type | No |
| Substitutions | Missing key, wrong type | No |

## Gotchas

1. **`ErrorHandler` with `halt: true` is used by the Parser as `throwUnexpectedToken()`.** The Parser has a helper that calls `handleError` with `halt: true` followed by a `throw` statement as a TypeScript fallback to ensure the `never` return type — `js/copy-service/Parser/Parser.ts#L144-L150`.

2. **Non-halting errors produce NO output in tests.** The `NODE_ENV !== 'test'` check means errors during testing are completely silent. Test files use `jest.spyOn(ErrorHandler, 'handleError')` to verify error calls.

## Evidence

- `js/copy-service/ErrorHandler/ErrorHandler.ts#L1-L32` — Full implementation
- `js/copy-service/ErrorHandler/ErrorHandler.test.ts` — 70 LOC of unit tests
