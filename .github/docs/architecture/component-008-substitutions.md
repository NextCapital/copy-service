# Component: Substitutions

## Identity

- **Type:** library module
- **Location:** `js/copy-service/Substitutions/Substitutions.ts`
- **Architecture role:** shared platform — runtime value resolution
- **Boundaries:** Wraps the caller's substitution object/function. Does NOT know about ASTs or copy keys — it only resolves values from the provided object.

## Purpose

The Substitutions class provides lazy-evaluated, type-safe access to runtime values that evaluators interpolate into copy. It exists because: (1) substitution objects may be expensive to compute; (2) individual substitution values may be functions; and (3) missing substitutions need consistent error handling.

## Responsibilities

- Lazily evaluates the substitution source (function → object conversion on first access)
- Resolves values by deep key path (e.g., `nested.deep.key`)
- Evaluates function-type substitution values automatically via `get()`
- Provides `getFunction()` for functional substitutions (does NOT call the function)
- Converts values to booleans for Switch nodes via `getBoolean()`
- Reports missing substitutions via ErrorHandler

## Internal Structure

### Lazy Evaluation

```typescript
// js/copy-service/Substitutions/Substitutions.ts#L27-L33
get substitutions(): object {
  if (_.isFunction(this._substitutions)) {
    this._substitutions = this._substitutions();  // call once, cache result
  }
  return this._substitutions;
}
```

The substitutions source can be either an object or a function returning an object. The function is called at most once — on first property access — and the result replaces the function.

### Key Methods

| Method | Behavior | Used By |
|--------|----------|---------|
| `get(key)` | `_.result(subs, key)` — if value is a function, calls it | Substitute, RefSubstitute, Switch nodes |
| `getFunction(key)` | `_.get(subs, key)` — returns function without calling it, warns if not a function | Functional nodes |
| `getBoolean(key)` | Calls `get(key)`, then: number `1` → `true`, other numbers → `false`, else `Boolean(value)` | Switch nodes |

### Missing Value Handling

When a key is not found:

1. Logs a warning via `ErrorHandler.handleError()` (non-halting)
2. Returns `''` (empty string) from `get()` (which becomes `false` from `getBoolean()`)
3. Returns `undefined` from `getFunction()`

This design ensures missing substitutions produce empty text rather than crashing the page.

## Gotchas

1. **`getBoolean()` treats `1` as truthy, but `2` as falsy.** This is intentional for pluralization: the number `1` means "singular" (left branch of Switch), while `0`, `2`, `3`, etc. mean "plural" (right branch). Non-number values use standard JavaScript truthiness.

2. **`get()` calls function values automatically.** If a substitution value is a function, `lodash.result()` invokes it. Use `getFunction()` when you need the function itself (as Functional nodes do).

3. **The lazy evaluation is one-shot.** Once the substitutions function is called, its result is cached permanently on the `Substitutions` instance. The function will not be called again, even if the substitutions instance is reused.

## Evidence

- `js/copy-service/Substitutions/Substitutions.ts#L1-L114` — Full implementation
- `js/copy-service/Substitutions/Substitutions.ts#L27-L33` — Lazy evaluation getter
- `js/copy-service/Substitutions/Substitutions.ts#L44-L51` — `get()` with `_.result()`
- `js/copy-service/Substitutions/Substitutions.ts#L59-L77` — `getFunction()` with validation
- `js/copy-service/Substitutions/Substitutions.ts#L97-L107` — `getBoolean()` with `1`-is-singular rule
- `js/copy-service/Substitutions/Substitutions.test.ts` — 124 LOC of unit tests
