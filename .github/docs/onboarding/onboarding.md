# Developer Onboarding Guide

## What is Copy Service?

Copy Service is a library that centralizes all user-facing text ("copy") in your application. Instead of hardcoding strings in templates, you define copy in JSON files using a custom DSL, then evaluate it at runtime into the format you need (plain text, HTML, or React JSX).

**Why not just use i18next?** Copy Service was built because i18next has limitations with formatted output (see [README.md](../../../README.md) for a full comparison). The key advantages: direct JSX rendering without hacks, multiple evaluators from one copy store, and a more expressive DSL.

## Architecture in 30 Seconds

```
JSON copy file → CopyService (stores) → Parser (tokenize + parse) → AST → Evaluator (walk) → Output
```

1. **Register** copy from JSON files into `CopyService`
2. **Parse** happens lazily on first access (DSL string → AST)
3. **Evaluate** the AST with an evaluator to produce output

See [Architecture README](../README.md) for the full architecture diagram and component inventory.

## Quick Start

### 1. Install

```sh
npm install --save @nextcapital/copy-service
```

### 2. Create a Copy File

```json
// copy.json
{
  "greeting": "Hello, #{name}!",
  "farewell": "Goodbye, #{name}. ${greeting}"
}
```

### 3. Use It

```typescript
import { CopyService } from '@nextcapital/copy-service';
import PlainTextEvaluator from '@nextcapital/copy-service/PlainTextEvaluator';

import copy from './copy.json';

const copyService = new CopyService();
copyService.registerCopy(copy);

const evaluator = new PlainTextEvaluator(copyService);

evaluator.getCopy('greeting', { name: 'Alice' });
// → "Hello, Alice!"

evaluator.getCopy('farewell', { name: 'Alice' });
// → "Goodbye, Alice. Hello, Alice!"
```

## Project Structure

```
js/
├── index.ts                          # Package entry point (re-exports)
├── copy-service/
│   ├── CopyService.ts                # Copy registration and storage
│   ├── IntlCopyService.ts            # Multi-language wrapper
│   ├── Parser/Parser.ts              # Tokenizer + recursive-descent parser
│   ├── SyntaxNode/SyntaxNode.ts      # AST base class
│   ├── Evaluator/Evaluator.ts        # Abstract evaluator base
│   ├── Substitutions/Substitutions.ts # Runtime value resolution
│   ├── ErrorHandler/ErrorHandler.ts  # Centralized error handling
│   ├── Verbatim/Verbatim.ts          # Literal text node
│   ├── Reference/Reference.ts        # Copy reference node (${})
│   ├── Substitute/Substitute.ts      # Substitution node (#{})
│   ├── RefSubstitute/RefSubstitute.ts # Ref-substitution node (%{})
│   ├── Switch/Switch.ts              # Conditional node (*{}{}{})
│   ├── Functional/Functional.ts      # Function call node (^{}{})
│   ├── Formatting/Formatting.ts      # HTML tag node (<tag>)
│   ├── Newline/Newline.ts            # Newline node
│   └── WordBreak/WordBreak.ts        # Word break node
├── plain-text-evaluator/
│   └── PlainTextEvaluator.ts         # String output
├── html-evaluator/
│   └── HtmlEvaluator.ts             # HTML string output
└── react-evaluator/
    └── ReactEvaluator.ts            # React JSX output
```

Every source file has a co-located `.test.ts` file.

## Key Concepts to Understand

### 1. The DSL

Copy strings use a custom syntax. See [dsl-reference.md](../guides/dsl-reference.md) for the full reference. Quick summary:

| Pattern | Syntax | Example |
|---------|--------|---------|
| Include other copy | `${key}` | `${account.name}` |
| Substitute a value | `#{key}` | `#{userName}` |
| Conditional (plural) | `*{singular}{plural}{count}` | `*{item}{items}{count}` |
| Formatting | `<tag>text</tag>` | `<strong>bold</strong>` |
| Link/function | `^{text}{fn}[args]` | `^{click}{makeLink}[url]` |

### 2. AST Nodes

Each syntax element maps to a `SyntaxNode` subclass. The parser creates a linked list of nodes via `sibling` pointers. See [component-004-syntax-nodes.md](../components/component-004-syntax-nodes.md).

### 3. Evaluators

Evaluators walk the AST and produce output. The three built-in evaluators share the same interface:

```typescript
evaluator.getCopy(key: string, substitutions?: object | (() => object)): T
```

| Evaluator | Output Type | Use Case |
|-----------|------------|----------|
| `PlainTextEvaluator` | `string` | Plain text display, emails, logs |
| `HtmlEvaluator` | `string` (HTML) | Server-rendered HTML, email templates |
| `ReactEvaluator` | `React.ReactNode` | React component rendering |

### 4. Internationalization

For multi-language support, use `IntlCopyService` instead of `CopyService`. See [component-002-intl-copy-service.md](../components/component-002-intl-copy-service.md) and [runtime-flow-002-intl-fallback.md](../flows/runtime-flow-002-intl-fallback.md) for details.

```typescript
import { IntlCopyService } from '@nextcapital/copy-service';

const hierarchy = { "en-us": null, "es": "en-us" };
const service = new IntlCopyService("en-us", hierarchy);
service.registerCopy(englishCopy, "en-us");
service.registerCopy(spanishCopy, "es");

// Use with any evaluator — same API as CopyService
const evaluator = new PlainTextEvaluator(service);
```

## Development Workflow

### Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests (unit + integration) |
| `npm run lint` | Run ESLint + cspell + markdownlint |
| `npm run tsc` | Type-check and compile to `ts-output/` |
| `npm run ci:local` | Full CI pipeline: lint → test → tsc → tsc:test |

### Adding a New Feature

1. **New syntax element:** Requires a new SyntaxNode subclass, Parser changes, and handler in ALL evaluators. See the [Extension Points](../README.md#extension-points) table.
2. **New evaluator:** Extend `Evaluator<T>` or `PlainTextEvaluator`. See [tutorial-new-evaluator.md](../guides/tutorial-new-evaluator.md).
3. **New HTML tag:** Add to `Parser.ALLOWED_HTML_TAGS`. No other changes needed.

### Test Coverage

100% function coverage is required. Each source file has a co-located test file. Integration tests in `integration-tests/` exercise full end-to-end flows using the reference copy file at `integration-tests/copy.json`.

## Common Patterns

### Tenant Overrides

Register base copy first, then tenant-specific overrides:

```typescript
copyService.registerCopy(baseCopy);     // generic copy
copyService.registerCopy(tenantCopy);   // overrides specific keys
```

Merging rules: strings replace, objects merge recursively.

### Lazy Substitutions

For expensive-to-compute substitutions, pass a function. See [component-008-substitutions.md](../components/component-008-substitutions.md) for details.

```typescript
evaluator.getCopy('key', () => ({
  expensiveValue: computeExpensiveValue()
}));
```

### Links in Copy (React)

```json
{ "terms": "By continuing, you agree to our ^{Terms of Service}{makeLink}[/terms]" }
```

```tsx
evaluator.getCopy('terms', {
  makeLink: (text, url) => <a href={url}>{text}</a>
});
```

## Where to Learn More

- [Architecture README](../README.md) — Full architecture overview
- [DSL Reference](../guides/dsl-reference.md) — Complete syntax documentation
- [Glossary](../guides/glossary.md) — Proprietary term definitions
- [README.md](../../../README.md) — Installation, usage examples, comparison to i18next
- [CONTRIBUTING.md](../../../CONTRIBUTING.md) — Contribution guidelines
- [MIGRATION.md](../../../MIGRATION.md) — ESM migration guide (v6 → v7)
