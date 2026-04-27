# Component: ReactEvaluator

## Identity

- **Type:** library module
- **Location:** `js/react-evaluator/ReactEvaluator.ts`
- **Architecture role:** evaluation — converts ASTs to React JSX
- **Boundaries:** Reads ASTs from `CopyService`. Produces `React.ReactNode` output. Does NOT parse or store copy.

## Purpose

ReactEvaluator walks ASTs and produces React elements (JSX) as output. It exists because React applications need copy rendered as actual React component trees — not HTML strings inserted via `dangerouslySetInnerHTML`. This allows substitutions to include React components (e.g., links, tooltips) that participate in React's reconciliation and event system.

## Why It Doesn't Extend PlainTextEvaluator

`ReactEvaluator` extends `Evaluator<React.ReactNode>` directly (not `PlainTextEvaluator`) because its output type is fundamentally different. String evaluators concatenate with `+`. React evaluation requires merging React nodes via Fragment construction — a completely different algorithm implemented in `_mergePrefixes()`.

## Gotchas

1. **Functional results are wrapped in a Fragment when `allowFunctional` is true and the substitution resolves to a function.** When either condition fails, the inner copy is returned as-is without a Fragment wrapper.

2. **`Substitute` returns `null` for empty/nil values**, not an empty string. In React, `null` renders nothing, while `''` could produce an empty text node.

3. **The evaluator uses `React.createElement` throughout**, not JSX syntax. This is because the library is a runtime dependency — JSX would require a build step in the consumer's pipeline for this file specifically.

## Evidence

- `js/react-evaluator/ReactEvaluator.ts#L1-L193` — Full implementation
- `js/react-evaluator/ReactEvaluator.ts#L30-L120` — `evalAST()` with all node types
- `js/react-evaluator/ReactEvaluator.ts#L147-L193` — `_mergePrefixes()` Fragment merging
- `js/react-evaluator/ReactEvaluator.test.ts` — 402 LOC of unit tests
- `integration-tests/tests/ReactEvaluatorIntegration.test.ts` — Integration tests
