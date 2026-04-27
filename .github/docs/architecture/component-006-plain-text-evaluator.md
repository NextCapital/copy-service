# Component: PlainTextEvaluator and HtmlEvaluator

## Identity

- **Type:** library module
- **Locations:**
  - `js/plain-text-evaluator/PlainTextEvaluator.ts`
  - `js/html-evaluator/HtmlEvaluator.ts`
- **Architecture role:** evaluation — converts ASTs to string output
- **Boundaries:** Reads ASTs from `CopyService`. Does NOT parse or store copy.

## Purpose

`PlainTextEvaluator` walks ASTs and produces plain text strings. `HtmlEvaluator` extends it to produce HTML strings. They share a class because the evaluation logic is identical — only three output tokens differ (newlines, word breaks, and formatting tag rendering).

## PlainTextEvaluator

### evalAST Implementation

The `evalAST` method uses `instanceof` checks to dispatch on node type, then processes each node: — `js/plain-text-evaluator/PlainTextEvaluator.ts#L30-L118`

| Node Type | Behavior |
|-----------|----------|
| `Newline` | Appends `getNewline()` (default: `\n`) |
| `WordBreak` | Appends `getWordBreak()` (default: empty string) |
| `Verbatim` | Appends `ast.text` |
| `Reference` | Recursively evaluates the referenced AST |
| `Substitute` | Calls `substitutions.get(key)`, converts to string |
| `RefSubstitute` | Gets a copy key from substitutions, evaluates that key's AST |
| `Switch` | Calls `substitutions.getBoolean(key)`, evaluates left or right branch |
| `Functional` | Calls `substitutions.getFunction(key)`, passes evaluated copy + args. When `allowFunctional` is `false`, returns inner copy without calling function |
| `Formatting` | When `allowsFormattingTags()` is `true`, wraps in HTML tags. Otherwise strips tags |
| Unknown | Logs error, returns empty string |

After evaluating the current node, the method recurses on `ast.sibling`, appending the result to the prefix. This builds the output string left-to-right through the sibling chain.

### Caching Pattern

Each node evaluation follows this pattern:

```typescript
// Check cache first
const cached = this.getCached(ast);
if (cached) return copyPrefix + cached;

// ... evaluate node to `copy` ...

// Recurse on sibling, then cache the full result
const evaluated = this.evalAST(copy, ast.sibling, substitutions);
this.setCacheIfCacheable(ast, evaluated);
return copyPrefix + evaluated;
```

The cached value includes the sibling chain's result, not just the current node. This means a single cache hit can skip evaluation of the entire remaining chain.

### Override Points

| Method | Default | Purpose |
|--------|---------|---------|
| `allowsFormattingTags()` | `false` | Controls whether `<tag>` syntax is preserved in output |
| `getNewline()` | `'\n'` | Output for Newline nodes |
| `getWordBreak()` | `''` | Output for WordBreak nodes |
| `getInitialResult()` | `''` | Empty/starting value for string accumulation |

## HtmlEvaluator

`HtmlEvaluator` inherits ALL evaluation logic from `PlainTextEvaluator` and overrides only three methods:

```typescript
// js/html-evaluator/HtmlEvaluator.ts
class HtmlEvaluator extends PlainTextEvaluator {
  getNewline(): string { return '<br/>'; }
  getWordBreak(): string { return '<wbr/>'; }
  allowsFormattingTags(): boolean { return true; }
}
```

| Behavior | PlainTextEvaluator | HtmlEvaluator |
|----------|-------------------|---------------|
| `<strong>text</strong>` | `"text"` | `"<strong>text</strong>"` |
| `\n` in copy | `"\n"` | `"<br/>"` |
| `\b` in copy | `""` | `"<wbr/>"` |

## Evidence

- `js/plain-text-evaluator/PlainTextEvaluator.ts#L1-L146` — Full PlainTextEvaluator
- `js/plain-text-evaluator/PlainTextEvaluator.ts#L30-L118` — `evalAST()` node dispatch
- `js/html-evaluator/HtmlEvaluator.ts#L1-L30` — Full HtmlEvaluator (30 LOC)
- `js/plain-text-evaluator/PlainTextEvaluator.test.ts` — 352 LOC of unit tests
- `js/html-evaluator/HtmlEvaluator.test.ts` — 44 LOC of unit tests
- `integration-tests/tests/PlainTextEvaluatorIntegration.test.ts` — Integration tests
- `integration-tests/tests/HtmlEvaluatorIntegration.test.ts` — Integration tests
