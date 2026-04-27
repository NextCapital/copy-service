# Component: Evaluator (Abstract Base)

## Identity

- **Type:** library module (abstract class)
- **Location:** `js/copy-service/Evaluator/Evaluator.ts`
- **Architecture role:** orchestration — abstract contract for AST evaluation
- **Boundaries:** Owns the evaluation cache (`WeakMap`) and the public `getCopy()` API. Delegates AST walking to concrete subclass implementations.

## Purpose

Evaluator defines the shared contract for turning an AST into output. It owns caching and the `getCopy()` entry point, while subclasses implement format-specific `evalAST()` logic.

## Responsibilities

- Provides the `getCopy(key, substitutions)` entry point used by application code
- Wraps raw substitution input in a `Substitutions` instance
- Retrieves ASTs from the copy service
- Manages a `WeakMap` evaluation cache for cacheable AST subtrees
- Defines the abstract `evalAST()` and `getInitialResult()` contract

## Non-Responsibilities

- Does NOT parse copy — that's `CopyService`
- Does NOT implement format-specific evaluation — subclasses do that

## How It Works

### `getCopy()` Flow

1. Wrap raw substitutions in a `Substitutions` instance (handles lazy evaluation) — `js/copy-service/Evaluator/Evaluator.ts#L72`
2. Call `copyService.getAstForKey(key)` to get the AST — `js/copy-service/Evaluator/Evaluator.ts#L73`
3. Call `evalAST(getInitialResult(), ast, substitutions)` — delegates to the subclass — `js/copy-service/Evaluator/Evaluator.ts#L75`

### Subclass Contract

Subclasses must implement:

| Method | Returns | Purpose |
|--------|---------|---------|
| `evalAST(prefix, ast, subs)` | `T` | Recursively walk the AST, evaluate each node, and accumulate the result |
| `getInitialResult()` | `T` | The "empty" starting value (`''` for strings, `null` for React) |

### `_handleError` Helper

```typescript
// js/copy-service/Evaluator/Evaluator.ts#L83-L87
protected _handleError(error: string, options?: { halt?: boolean }): void | never {
  ErrorHandler.handleError(this.constructor.name, error, options);
}
```

Uses `this.constructor.name` so error messages include the concrete evaluator class name.

## Evidence

- `js/copy-service/Evaluator/Evaluator.ts#L1-L95` — Full implementation
- `js/copy-service/Evaluator/Evaluator.ts#L27-L30` — WeakMap cache initialization
- `js/copy-service/Evaluator/Evaluator.ts#L68-L76` — `getCopy()` flow
- `js/copy-service/Evaluator/Evaluator.test.ts` — 137 LOC of unit tests
