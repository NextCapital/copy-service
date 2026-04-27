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

## Internal Structure

```typescript
// js/copy-service/Evaluator/Evaluator.ts
abstract class Evaluator<T> {
  readonly copyService: CopyService | IntlCopyService;
  private evaluationCache: WeakMap<SyntaxNode, T>;
  allowFunctional: boolean;

  getCopy(key: string, rawSubstitutions?: object | (() => object)): T;
  getCached(ast: AST): T | undefined;
  setCacheIfCacheable(ast: AST, evaluated: T): void;

  abstract evalAST(copyPrefix: T, ast: AST, substitutions: Substitutions): T;
  abstract getInitialResult(): T;
}
```

### Generic Type Parameter `T`

The type parameter `T` represents the output format:
- `PlainTextEvaluator extends Evaluator<string>` — produces strings
- `ReactEvaluator extends Evaluator<React.ReactNode>` — produces React nodes

### Evaluation Cache

The cache is a `WeakMap<SyntaxNode, T>`. AST nodes are the keys, so when an AST node is garbage-collected, its cached evaluation result is also freed. This prevents memory leaks when copy is re-registered (old ASTs are replaced).

**Cache invariant:** Only the result of evaluating an AST with NO prefix is cached. The `setCacheIfCacheable` call happens after `evalAST(copy, ast.sibling, subs)`, where `copy` is the result of evaluating just this node. The prefix is applied later by the caller.

### `allowFunctional` Option

When `false`, `Functional` AST nodes return their inner copy without calling the substitution function. This is useful for rendering copy in contexts where function execution is undesirable (e.g., static previews, copy management UIs).

## Interfaces

### Inbound

| Method | Purpose | Called By |
|--------|---------|----------|
| `getCopy(key, subs?)` | Main entry point — evaluate a copy key | Application code |
| `getCached(ast)` | Check cache for a previously evaluated AST | Subclass `evalAST()` |
| `setCacheIfCacheable(ast, result)` | Store result in cache if AST is cacheable | Subclass `evalAST()` |

### Outbound

| Target | Method | Purpose |
|--------|--------|---------|
| `CopyService` / `IntlCopyService` | `getAstForKey(key)` | Retrieve the AST for evaluation |
| `Substitutions` | constructor | Wrap raw substitution input |
| `ErrorHandler` | `handleError(...)` | Via `_handleError()` helper |

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
