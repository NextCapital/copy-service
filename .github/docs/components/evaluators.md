# Component: Evaluators

Evaluators walk ASTs and produce formatted output. The abstract `Evaluator<T>` base class owns caching and the `getCopy()` entry point, while concrete subclasses implement format-specific `evalAST()` logic.

## Evaluator (Abstract Base)

### `getCopy()` Flow

1. Wrap raw substitutions in a `Substitutions` instance (handles lazy evaluation)
2. Call `copyService.getAstForKey(key)` to get the AST
3. Call `evalAST(getInitialResult(), ast, substitutions)` — delegates to the subclass

### Subclass Contract

Subclasses must implement:

| Method | Returns | Purpose |
|--------|---------|---------|
| `evalAST(prefix, ast, subs)` | `T` | Recursively walk the AST, evaluate each node, and accumulate the result |
| `getInitialResult()` | `T` | The "empty" starting value (`''` for strings, `null` for React) |

### Evaluation Cache

The base class maintains a `WeakMap<SyntaxNode, T>` that caches evaluation results for cacheable (substitution-free) AST subtrees. The cached value includes the sibling chain's result, so a single cache hit skips evaluation of the entire remaining chain.

## PlainTextEvaluator

### evalAST Implementation

The `evalAST` method uses `instanceof` checks to dispatch on syntax node type. After evaluating the current node, the method recurses on `ast.sibling`, appending the result to the prefix. This builds the output string left-to-right through the sibling chain.

### Override Points

| Method | Default | Purpose |
|--------|---------|---------|
| `allowsFormattingTags()` | `false` | Controls whether `<tag>` syntax is preserved in output |
| `getNewline()` | `'\n'` | Output for Newline nodes |
| `getWordBreak()` | `''` | Output for WordBreak nodes |
| `getInitialResult()` | `''` | Empty/starting value for string accumulation |

## HtmlEvaluator

`HtmlEvaluator` extends `PlainTextEvaluator` and overrides three methods: `getNewline()` returns `'<br/>'`, `getWordBreak()` returns `'<wbr/>'`, and `allowsFormattingTags()` returns `true`. This means formatting tags are preserved in output, newlines become `<br/>`, and word breaks become `<wbr/>`.

## ReactEvaluator

`ReactEvaluator` extends `Evaluator<React.ReactNode>` directly — not `PlainTextEvaluator` — because React output requires Fragment-based merging (`_mergePrefixes()`) instead of string concatenation. It uses `React.createElement` throughout (no JSX) since the library ships as a runtime dependency.

### Gotchas

1. **Functional results are wrapped in a Fragment when `allowFunctional` is true and the substitution resolves to a function.** When either condition fails, the inner copy is returned as-is without a Fragment wrapper.

2. **`Substitute` returns `null` for empty/nil values**, not an empty string. In React, `null` renders nothing, while `''` could produce an empty text node.
