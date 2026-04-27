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

## Internal Structure

```typescript
// js/copy-service/ErrorHandler/ErrorHandler.ts
class ErrorHandler {
  static handleError(name: string, error: string, options?: { halt?: boolean }): void | never {
    const message = `${name}: ${error}`;
    if (options.halt) {
      throw new Error(message);  // always throws regardless of environment
    } else if (this.isInDevMode() && process.env.NODE_ENV !== 'test') {
      console.error(message);  // only logs in development
    }
  }

  static isInDevMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
```

### Error Behavior Matrix

| `options.halt` | `NODE_ENV` | Behavior |
|:---:|:---:|---|
| `true` | any | **Throws** `Error` |
| `false`/omitted | `development` | Logs to `console.error` |
| `false`/omitted | `test` | Silent (no output) |
| `false`/omitted | `production` | Silent (no output) |

### TypeScript Overloads

The method uses function overloads for type safety:

```typescript
static handleError(name: string, error: string, options?: { halt: false } | object): void;
static handleError(name: string, error: string, options?: { halt: true }): never;
```

When `halt: true` is passed, TypeScript knows the function never returns, enabling the compiler to understand control flow after error calls.

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
