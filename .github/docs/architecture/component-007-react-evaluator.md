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

## Internal Structure

### evalAST Implementation

Node dispatch is similar to `PlainTextEvaluator` but returns React nodes: — `js/react-evaluator/ReactEvaluator.ts#L30-L120`

| Node Type | Behavior |
|-----------|----------|
| `Newline` | `React.createElement('br', null)` |
| `WordBreak` | `React.createElement('wbr', null)` |
| `Verbatim` | `ast.text` (strings are valid React nodes) |
| `Reference` | Recursively evaluates the referenced AST |
| `Substitute` | `substitutions.get(key).toString()` — returns `null` for empty/nil |
| `RefSubstitute` | Gets copy key from substitutions, evaluates that key |
| `Switch` | Evaluates left or right branch based on `getBoolean()` |
| `Functional` | Calls the function, wraps result in a Fragment (because functions can return arbitrary JSX) |
| `Formatting` | `React.createElement(ast.tag, null, childContent)` — unwraps Fragments before nesting to avoid `<Fragment><strong><Fragment>...</Fragment></strong></Fragment>` |
| Unknown | Logs error, returns `null` |

### `_mergePrefixes()` — The Key Algorithm

Merging two React nodes is non-trivial. String concatenation doesn't work because React nodes can be elements, strings, or null. The `_mergePrefixes()` method handles all combinations: — `js/react-evaluator/ReactEvaluator.ts#L140-L192`

**Rules:**
1. If either side is null/falsy → return the other side
2. If both are strings → concatenate (happy path, avoids Fragment allocation)
3. If both are Fragments → merge children into one Fragment
4. If one is a Fragment and the other isn't → merge the non-Fragment into the Fragment's children
5. If neither is a Fragment → wrap both in a new Fragment

Without fragment merging, adjacent nodes would create deeply nested `<Fragment>` trees. Merging keeps the tree flat — top-level Fragments only come from `_mergePrefixes` or Functional nodes, so merging their children is always safe.

```typescript
// js/react-evaluator/ReactEvaluator.ts#L155-L192
private _mergePrefixes(left: React.ReactNode, right: React.ReactNode): React.ReactNode {
  // ... null checks ...

  // String + String = concatenation (no Fragment needed)
  if (_.isString(left) && _.isString(right)) {
    return left + right;
  }

  // Fragment + Fragment = merge children
  if (React.isValidElement(left) && left.type === React.Fragment) {
    if (React.isValidElement(right) && right.type === React.Fragment) {
      return this._createFragment(left.props.children, right.props.children);
    }
    return this._createFragment(left.props.children, right);
  }

  // Any + Fragment or Element + Element = wrap in Fragment
  // ...
}
```

### Formatting Node Handling

When creating elements for formatting tags, the evaluator unwraps Fragment children to avoid nesting:

```typescript
// js/react-evaluator/ReactEvaluator.ts#L103-L112
if (React.isValidElement(jsx) && jsx.type === React.Fragment) {
  childContent = jsx.props.children;  // unwrap Fragment
}
copy = React.createElement(ast.tag, null, childContent);
```

This prevents `<strong><Fragment>text</Fragment></strong>` and instead produces `<strong>text</strong>`.

### `getInitialResult()`

Returns `null` (not `''`). React's initial empty state is `null`, not an empty string, because React renders `null` as nothing while `''` can produce empty text nodes.

## Gotchas

1. **Functional results are always wrapped in a Fragment.** User-provided functions can return arbitrary JSX (elements, strings, arrays). The Fragment wrapper normalizes all return values into a consistent type.

2. **`Substitute` returns `null` for empty/nil values**, not an empty string. In React, `null` renders nothing, while `''` could produce an empty text node.

3. **The evaluator uses `React.createElement` throughout**, not JSX syntax. This is because the library is a runtime dependency — JSX would require a build step in the consumer's pipeline for this file specifically.

## Evidence

- `js/react-evaluator/ReactEvaluator.ts#L1-L193` — Full implementation
- `js/react-evaluator/ReactEvaluator.ts#L30-L120` — `evalAST()` with all node types
- `js/react-evaluator/ReactEvaluator.ts#L140-L192` — `_mergePrefixes()` Fragment merging
- `js/react-evaluator/ReactEvaluator.test.ts` — 402 LOC of unit tests
- `integration-tests/tests/ReactEvaluatorIntegration.test.ts` — Integration tests
