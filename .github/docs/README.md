# Copy Service — Architecture Documentation

## Overview

Copy Service (`@nextcapital/copy-service` v7.2.1) is a TypeScript library for UI copy management and internationalization (i18n). It centralizes human-readable text in JSON files, parses it through a custom DSL into ASTs, and evaluates those ASTs into formatted output (plain text, HTML, or React JSX) with runtime substitutions.

The library exists to solve three problems that standard i18n tools handle poorly: (1) rendering copy to multiple output formats from a single source, (2) supporting an expressive DSL with nested references, conditional logic, and functional transformations, and (3) delivering high performance through lazy parsing and aggressive caching.

**Scope:** This documentation covers the `copy-service` repository only. UI framework integration (ux-framework) is documented separately in that repository.

- **Version:** 7.2.1
- **Language:** TypeScript (ESM)
- **Entry point:** `js/index.ts` → compiled to `ts-output/index.js`
- **LOC:** ~2,300 source, ~3,500 unit tests, ~1,600 integration tests
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
Evaluators.Evaluator -> AST Layer.nodes: "walks AST"
```

## Component Inventory

| Component | Responsibility | Location | Depends On |
|-----------|---------------|----------|------------|
| [CopyService](components/copy-service.md) | Register, store, and lazy-parse copy into ASTs | `js/copy-service/CopyService.ts` | Parser, SyntaxNode, ErrorHandler |
| [IntlCopyService](components/intl-copy-service.md) | Multi-language wrapper with fallback hierarchy | `js/copy-service/IntlCopyService.ts` | CopyService, ErrorHandler |
| [Parser](components/parser.md) | Tokenize DSL strings and parse into ASTs | `js/copy-service/Parser/Parser.ts` | All SyntaxNode subclasses, ErrorHandler |
| [SyntaxNode](components/syntax-nodes.md) | Base class and 9 AST node types | `js/copy-service/SyntaxNode/SyntaxNode.ts` | — |
| [Evaluator](components/evaluator.md) | Abstract base for AST evaluation | `js/copy-service/Evaluator/Evaluator.ts` | Substitutions, SyntaxNode, CopyService |
| [PlainTextEvaluator](components/plain-text-evaluator.md) | Evaluates AST to plain text strings | `js/plain-text-evaluator/PlainTextEvaluator.ts` | Evaluator, all SyntaxNode subclasses |
| [HtmlEvaluator](components/plain-text-evaluator.md#htmlevaluator) | Evaluates AST to HTML strings | `js/html-evaluator/HtmlEvaluator.ts` | PlainTextEvaluator |
| [ReactEvaluator](components/react-evaluator.md) | Evaluates AST to React JSX | `js/react-evaluator/ReactEvaluator.ts` | Evaluator, all SyntaxNode subclasses |
| [Substitutions](components/substitutions.md) | Lazy-resolve substitution values from user input | `js/copy-service/Substitutions/Substitutions.ts` | ErrorHandler |
| [ErrorHandler](components/error-handler.md) | Centralized error logging and halting | `js/copy-service/ErrorHandler/ErrorHandler.ts` | — |

## Document Index

### Component Deep-Dives

- [copy-service.md](components/copy-service.md) — Copy registration, storage, and lazy parsing
- [intl-copy-service.md](components/intl-copy-service.md) — Multi-language support and hierarchy fallback
- [parser.md](components/parser.md) — Tokenizer and recursive-descent parser
- [syntax-nodes.md](components/syntax-nodes.md) — All 9 AST node types
- [evaluator.md](components/evaluator.md) — Abstract evaluator base class
- [plain-text-evaluator.md](components/plain-text-evaluator.md) — PlainTextEvaluator and HtmlEvaluator
- [react-evaluator.md](components/react-evaluator.md) — ReactEvaluator and JSX fragment merging
- [substitutions.md](components/substitutions.md) — Substitution resolution
- [error-handler.md](components/error-handler.md) — Error handling strategy

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

AST nodes form a singly-linked list via `sibling` pointers rather than a children array. Tree depth comes from node-specific child properties (`copy`, `left`, `right`). This design minimizes object allocations. See [syntax-nodes.md](components/syntax-nodes.md) for details.

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

### Why `PlainTextEvaluator` and `HtmlEvaluator` share a class hierarchy?

`HtmlEvaluator` is a thin subclass that overrides only three output methods. See [plain-text-evaluator.md](components/plain-text-evaluator.md).

### Why `ReactEvaluator` doesn't extend `PlainTextEvaluator`?

`ReactEvaluator` returns `React.ReactNode`, requiring Fragment-based merging instead of string concatenation. See [react-evaluator.md](components/react-evaluator.md).

## Key Files

| File | Role |
|------|------|
| `js/index.ts` | Package entry point — re-exports all public API |
| `js/copy-service/CopyService.ts` | Copy registration, lazy parsing, copy merging |
| `js/copy-service/IntlCopyService.ts` | Multi-language copy service with hierarchy fallback |
| `js/copy-service/Parser/Parser.ts` | Tokenizer and recursive-descent parser (609 LOC) |
| `js/copy-service/SyntaxNode/SyntaxNode.ts` | Base class for AST nodes |
| `js/copy-service/Evaluator/Evaluator.ts` | Abstract evaluator with WeakMap caching |
| `js/plain-text-evaluator/PlainTextEvaluator.ts` | String output evaluator |
| `js/html-evaluator/HtmlEvaluator.ts` | HTML output evaluator (extends PlainTextEvaluator) |
| `js/react-evaluator/ReactEvaluator.ts` | React JSX output evaluator |
| `js/copy-service/Substitutions/Substitutions.ts` | Substitution value resolution |
| `js/copy-service/ErrorHandler/ErrorHandler.ts` | Centralized error handling |
| `integration-tests/copy.json` | Reference copy file for integration tests |

## Extension Points

| Extension Type | Directory | Convention | Canonical Example | Also Update |
|----------------|-----------|------------|-------------------|-------------|
| New Evaluator | `js/<name>-evaluator/` | `<Name>Evaluator.ts` | `js/plain-text-evaluator/PlainTextEvaluator.ts` | `js/index.ts` (re-export), `package.json` exports |
| New SyntaxNode | `js/copy-service/<Name>/` | `<Name>.ts` | `js/copy-service/Verbatim/Verbatim.ts` | `Parser.ts` (token + parse logic), all evaluators (handle new node type), `js/index.ts` |
| New HTML tag | — | — | `Parser.ALLOWED_HTML_TAGS` in `js/copy-service/Parser/Parser.ts` | — |

See [tutorial-new-evaluator.md](guides/tutorial-new-evaluator.md) for a step-by-step guide.

## Gotchas and Edge Cases

1. **Lazy parsing can throw.** `getAstForKey()` parses on first access. If the DSL syntax is invalid, parsing fails silently (returns `null`, logs error). To catch parse errors early, call `parseAllCopy()` after registration — it throws on failure.

2. **Substitutions with `$` prefix.** The DSL uses `${}` for references and `#{}` for substitutions. A common mistake is writing `${value}` when `#{value}` is intended. The `$` version references another copy key, not a substitution.

3. **`Switch` uses `getBoolean()` with special numeric rules.** See [dsl-reference.md](guides/dsl-reference.md#switch) for the boolean evaluation table.

4. **`Functional` nodes are never cacheable.** Because functional substitutions execute arbitrary user-provided functions, their results cannot be cached. Any AST subtree containing a `Functional` node is also uncacheable.

5. **`IntlCopyService.getAstForKey()` converts `undefined` to `null`.** The base `CopyService` returns `undefined` when a language is set but no key is found (to allow `IntlCopyService` to differentiate "not found" from "parsed to null"). `IntlCopyService` handles this internally and always returns `AST | null` to evaluators.

6. **Copy merging replaces strings, merges objects.** When registering copy twice, a string value at the same key replaces the previous value. But object values merge recursively. This is by design for tenant overrides but can be surprising if you expect full replacement of a subtree.

7. **Escape special characters with backslash.** DSL syntax characters (`${`, `#{`, `%{`, `*{`, `^{`) can be escaped with `\` to produce literal text. The tokenizer handles this in `_tokenize()`.

## Testing and Quality

- **Test types:** Unit tests (Jest, `js/**/*.test.ts`) + integration tests (`integration-tests/**/*.test.ts`)
- **Coverage:** 100% function coverage required; near-100% statement/branch coverage
- **Patterns:** Each source file has a co-located `.test.ts` file. Integration tests exercise full register → parse → evaluate flows.
- **Run:** `npm test` (unit + integration), `npm run lint` (ESLint + cspell + markdownlint), `npm run tsc` (type-check + compile)

## Build, Deploy, and CI/CD

- **Build:** `npm run tsc` compiles TypeScript to `ts-output/` (ESM)
- **CI:** `npm run ci:local` runs lint → test → tsc → tsc:test
- **Publish:** `ts-output/` directory is published to npm (`"files": ["ts-output"]`)
- **Package exports:** Main entry + subpath exports for each evaluator

## Configuration and Environment

| Setting | Location | Purpose |
|---------|----------|---------|
| `NODE_ENV` | `process.env` | Controls error logging — `'production'` silences dev warnings, `'test'` silences console errors |
| `errorOnMissingRefs` | `CopyService` constructor | When `true`, missing copy keys throw instead of returning `null` |
| `allowFunctional` | `Evaluator` constructor | When `false`, `^{}{}` syntax returns inner copy without calling the function |

## Related Documentation

- [README.md](../../README.md) — Getting started, installation, usage examples, DSL syntax
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Contribution workflow, code style, commit conventions
- [MIGRATION.md](../../MIGRATION.md) — ESM migration guide (v6 → v7)

## Unknowns and Open Questions

| # | Severity | Claim | Context | Suggested Action |
|---|----------|-------|---------|------------------|
| 1 | LOW | Grammar comment says "many bothans died" suggesting the grammar was hard-won | README grammar section | Cosmetic — no action needed |

## Documentation Coverage Summary

| Metric | Value |
|--------|-------|
| **Areas Documented** | 14 sections with full coverage |
| **Areas Partially Covered** | 0 |
| **Areas Unknown** | 0 |
| **Total Evidence Citations** | 45+ file paths cited |
| **Total UNVERIFIED Markers** | 0 |
| **Confidence Distribution** | HIGH: 14 |
| **Coverage Scan Status** | 12/12 applicable categories Clear |
