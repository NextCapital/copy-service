# Copy Service — Architecture Documentation

## Overview

Copy Service (`@nextcapital/copy-service` v7.2.1) is a TypeScript library for UI copy management and internationalization (i18n). It centralizes human-readable text in JSON files, parses it through a custom DSL into ASTs, and evaluates those ASTs into formatted output (plain text, HTML, or React JSX) with runtime substitutions.

The library exists to solve three problems that standard i18n tools handle poorly: (1) rendering copy to multiple output formats from a single source, (2) supporting an expressive DSL with nested references, conditional logic, and functional transformations, and (3) delivering high performance through lazy parsing and aggressive caching.

**Scope:** This documentation covers the `copy-service` repository only. UI framework integration (ux-framework) is documented separately in that repository.

- **Version:** 7.2.1
- **Language:** TypeScript (ESM)
- **Entry point:** `js/index.ts` → compiled to `ts-output/index.js`
- **Dependencies:** `lodash` (runtime), `react`/`react-dom` (peer)

## Architecture Diagram

```d2
direction: down

Copy Store: {
  CopyService: CopyService
  IntlCopyService: IntlCopyService

  IntlCopyService -> CopyService: "wraps N instances\n(one per language)"
}

Parser: {
  parser: Parser
  tokenizer: "Tokenizer\n(internal)"

  tokenizer -> parser: "Token[]"
}

AST Layer: {
  SyntaxNode: "SyntaxNode (base)"
  nodes: "Verbatim | Reference | Substitute\nRefSubstitute | Switch | Functional\nFormatting | Newline | WordBreak"

  nodes -> SyntaxNode: "extends"
}

Evaluators: {
  Evaluator: "Evaluator<T> (abstract)"
  PlainText: PlainTextEvaluator
  Html: HtmlEvaluator
  ReactEval: ReactEvaluator

  PlainText -> Evaluator: extends
  Html -> PlainText: extends
  ReactEval -> Evaluator: extends
}

Copy Store.CopyService -> Parser.parser: "lazy parse on\nfirst access"
Parser.parser -> AST Layer.nodes: "builds AST from tokens"
Evaluators.Evaluator -> Copy Store.CopyService: "reads ASTs"
```

## Document Index

### Component Deep-Dives

- [copy-service.md](components/copy-service.md) — CopyService and IntlCopyService
- [parser.md](components/parser.md) — Tokenizer and recursive-descent parser
- [evaluators.md](components/evaluators.md) — All evaluators: base class, PlainText, HTML, and React

### Runtime Flows

- [copy-evaluation.md](flows/copy-evaluation.md) — End-to-end: register → parse → evaluate
- [intl-fallback.md](flows/intl-fallback.md) — Language hierarchy resolution
- [caching.md](flows/caching.md) — Lazy parsing and evaluation caching

### Guides

- [onboarding.md](onboarding/onboarding.md) — Developer onboarding guide
- [dsl-reference.md](guides/dsl-reference.md) — Complete DSL syntax reference
- [tutorial-new-evaluator.md](guides/tutorial-new-evaluator.md) — How to build a custom evaluator
- [glossary.md](guides/glossary.md) — Proprietary term definitions

## Key Concepts

### Parser-Evaluator Architecture

The system separates parsing (converting DSL strings to ASTs) from evaluation (converting ASTs to output). This separation exists because one AST can be evaluated by multiple evaluators — a single copy string simultaneously produces plain text, HTML, and React JSX without re-parsing.

### Lazy Parsing

Copy strings are NOT parsed when registered. They remain as raw strings until first accessed via `getAstForKey()`, avoiding startup overhead. See [caching.md](flows/caching.md) for the full caching strategy.

### Sibling-Linked AST

AST nodes form a singly-linked list via `sibling` pointers rather than a children array. Tree depth comes from node-specific child properties (`copy`, `left`, `right`). This design minimizes object allocations. See [dsl-reference.md](guides/dsl-reference.md) for the full node type listing.

### Evaluation Caching

The `Evaluator` base class uses a `WeakMap<SyntaxNode, T>` to cache evaluation results for cacheable (substitution-free) AST subtrees. See [caching.md](flows/caching.md).

### Copy Merging

Calling `registerCopy()` multiple times merges new copy into existing copy using `lodash.mergeWith`. String and AST values always replace (never merge), while objects merge recursively. This enables tenant-specific overrides: register base copy first, then register tenant copy that overwrites specific keys.

## Design Decisions

### Why a custom DSL instead of template literals?

Copy lives in JSON files — not code files. Template literals require JavaScript execution context. The DSL evaluates at runtime from static JSON, which can be loaded from APIs, files, or bundled assets.

### Why recursive-descent parsing?

The grammar is not left-recursive, making recursive-descent straightforward. An LR parser would be significantly more complex for the same grammar. The README explicitly warns against grammar changes that would require LR parsing.

### Why sibling pointers instead of children arrays?

Performance. The evaluator recursively walks the AST via tail-call-like patterns: `evalAST(copy, ast.sibling, subs)`. Arrays would require iteration and allocation; sibling pointers produce none.

## Extension Points

| Extension Type | Directory | Convention | Canonical Example | Also Update |
|----------------|-----------|------------|-------------------|-------------|
| New Evaluator | `js/<name>-evaluator/` | `<Name>Evaluator.ts` | `js/plain-text-evaluator/PlainTextEvaluator.ts` | `js/index.ts` (re-export), `package.json` exports |
| New SyntaxNode | `js/copy-service/<Name>/` | `<Name>.ts` | `js/copy-service/Verbatim/Verbatim.ts` | `Parser.ts` (token + parse logic), all evaluators (handle new node type), `js/index.ts` |
| New HTML tag | — | — | `Parser.ALLOWED_HTML_TAGS` in `js/copy-service/Parser/Parser.ts` | — |

## Gotchas and Edge Cases

1. **Lazy parsing can throw.** `getAstForKey()` parses on first access. If the DSL syntax is invalid, parsing fails silently (returns `null`, logs error). To catch parse errors early, call `parseAllCopy()` after registration — it throws on failure.

2. **Substitutions with `$` prefix.** The DSL uses `${}` for references and `#{}` for substitutions. A common mistake is writing `${value}` when `#{value}` is intended. The `$` version references another copy key, not a substitution.

3. **`Switch` uses `getBoolean()` with special numeric rules.** See [dsl-reference.md](guides/dsl-reference.md#switch) for the boolean evaluation table.

4. **`Functional` nodes are never cacheable.** Because functional substitutions execute arbitrary user-provided functions, their results cannot be cached. Any AST subtree containing a `Functional` node is also uncacheable.

5. **`IntlCopyService.getAstForKey()` converts `undefined` to `null`.** The base `CopyService` returns `undefined` when a language is set but no key is found (to allow `IntlCopyService` to differentiate "not found" from "parsed to null"). `IntlCopyService` handles this internally and always returns `AST | null` to evaluators.

6. **Copy merging replaces strings, merges objects.** When registering copy twice, a string value at the same key replaces the previous value. But object values merge recursively. This is by design for tenant overrides but can be surprising if you expect full replacement of a subtree.

7. **Escape special characters with backslash.** DSL syntax characters (`${`, `#{`, `%{`, `*{`, `^{`) can be escaped with `\` to produce literal text. The tokenizer handles this in `_tokenize()`.

## Related Documentation

- [README.md](../../README.md) — Getting started, installation, usage examples, DSL syntax
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Contribution workflow, code style, commit conventions
- [MIGRATION.md](../../MIGRATION.md) — ESM migration guide (v6 → v7)
