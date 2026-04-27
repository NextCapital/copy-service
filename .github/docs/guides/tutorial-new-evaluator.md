# Tutorial: Building a Custom Evaluator

## Why Build a Custom Evaluator?

The built-in evaluators cover plain text, HTML, and React JSX. For other formats (Markdown, terminal ANSI, Slack blocks), build a custom evaluator against the shared AST.

## Prerequisites

- Familiarity with the [AST node types](../components/syntax-nodes.md)
- Understanding of the [evaluation flow](../flows/copy-evaluation.md)

## Step 1: Create the Evaluator File

Create a new directory following the naming convention `js/<name>-evaluator/<Name>Evaluator.ts`:

```
js/markdown-evaluator/MarkdownEvaluator.ts
js/markdown-evaluator/MarkdownEvaluator.test.ts
```

## Step 2: Extend the Base Class

Choose your base class:

- Extend `Evaluator<T>` directly when your output type is NOT a string (like `ReactEvaluator` extends `Evaluator<React.ReactNode>`)
- Extend `PlainTextEvaluator` when your output IS a string and you only need to change formatting behavior (like `HtmlEvaluator` extends `PlainTextEvaluator`)

### Option A: Extending PlainTextEvaluator (String Output)

If your evaluator produces strings and only differs in how formatting, newlines, or word breaks render, extend `PlainTextEvaluator` and override the formatting methods:

```typescript
// js/markdown-evaluator/MarkdownEvaluator.ts
import PlainTextEvaluator from '../plain-text-evaluator/PlainTextEvaluator.js';

class MarkdownEvaluator extends PlainTextEvaluator {
  // Newlines become double-newline (Markdown paragraph break)
  override getNewline(): string {
    return '\n\n';
  }

  // Word breaks have no Markdown equivalent
  override getWordBreak(): string {
    return '';
  }

  // Formatting tags become Markdown syntax
  override allowsFormattingTags(): boolean {
    return true; // Required to see Formatting nodes in evalAST
  }
}

export default MarkdownEvaluator;
```

If you need Markdown syntax rather than HTML tags, extend `Evaluator<string>` directly and handle `Formatting` nodes in `evalAST()`.

### Option B: Extending Evaluator Directly (String Output)

```typescript
// js/markdown-evaluator/MarkdownEvaluator.ts
import _ from 'lodash';

import Evaluator from '../copy-service/Evaluator/Evaluator.js';
import Formatting from '../copy-service/Formatting/Formatting.js';
import Functional from '../copy-service/Functional/Functional.js';
import Newline from '../copy-service/Newline/Newline.js';
import Reference from '../copy-service/Reference/Reference.js';
import RefSubstitute from '../copy-service/RefSubstitute/RefSubstitute.js';
import Substitute from '../copy-service/Substitute/Substitute.js';
import Substitutions from '../copy-service/Substitutions/Substitutions.js';
import Switch from '../copy-service/Switch/Switch.js';
import SyntaxNode from '../copy-service/SyntaxNode/SyntaxNode.js';
import Verbatim from '../copy-service/Verbatim/Verbatim.js';
import WordBreak from '../copy-service/WordBreak/WordBreak.js';

// Map HTML tags to Markdown equivalents
const TAG_MAP: Record<string, { prefix: string; suffix: string }> = {
  strong: { prefix: '**', suffix: '**' },
  b: { prefix: '**', suffix: '**' },
  em: { prefix: '*', suffix: '*' },
  i: { prefix: '*', suffix: '*' },
  s: { prefix: '~~', suffix: '~~' },
  // Add more as needed
};

class MarkdownEvaluator extends Evaluator<string> {
  evalAST(
    copyPrefix: string,
    ast: SyntaxNode | null,
    substitutions: Substitutions
  ): string {
    if (!ast) {
      return copyPrefix;
    }

    const cached = this.getCached(ast);
    if (cached) {
      return copyPrefix + cached;
    }

    let copy: string;

    if (ast instanceof Newline) {
      copy = '\n\n';
    } else if (ast instanceof WordBreak) {
      copy = '';
    } else if (ast instanceof Verbatim) {
      copy = ast.text;
    } else if (ast instanceof Reference) {
      copy = this.evalAST(
        this.getInitialResult(),
        this.copyService.getAstForKey(ast.key) ?? null,
        substitutions
      );
    } else if (ast instanceof Substitute) {
      const value = substitutions.get(ast.key);
      copy = _.isNil(value) ? '' : value.toString();
    } else if (ast instanceof RefSubstitute) {
      const copyKey = substitutions.get(ast.key);
      copy = this.evalAST(
        this.getInitialResult(),
        this.copyService.getAstForKey(copyKey) ?? null,
        substitutions
      );
    } else if (ast instanceof Switch) {
      const decider = substitutions.getBoolean(ast.key);
      copy = this.evalAST(
        this.getInitialResult(),
        decider ? ast.left : ast.right,
        substitutions
      );
    } else if (ast instanceof Functional) {
      const method = substitutions.getFunction(ast.key) as
        ((...args: unknown[]) => unknown) | undefined;
      let text = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (this.allowFunctional && method && _.isFunction(method)) {
        text = String(method(text, ...ast.args));
      }

      copy = text;
    } else if (ast instanceof Formatting) {
      const text = this.evalAST(this.getInitialResult(), ast.copy, substitutions);
      const mapping = TAG_MAP[ast.tag];

      if (text && mapping) {
        copy = `${mapping.prefix}${text}${mapping.suffix}`;
      } else {
        copy = text; // Unknown tag: strip it
      }
    } else {
      this._handleError('Unknown node detected');
      return this.getInitialResult();
    }

    const evaluated = this.evalAST(copy, ast.sibling, substitutions);
    this.setCacheIfCacheable(ast, evaluated);

    return copyPrefix + evaluated;
  }

  getInitialResult(): string {
    return '';
  }
}

export default MarkdownEvaluator;
```

### Option C: Extending Evaluator Directly (Non-String Output)

Follow the `ReactEvaluator` pattern (`js/react-evaluator/ReactEvaluator.ts`). Key differences from string evaluators:

1. Define `T` as your output type (e.g., `Evaluator<SlackBlock[]>`)
2. Implement a merge function (like `_mergePrefixes()`) for combining output segments
3. Return a format-appropriate "empty" value from `getInitialResult()` (e.g., `[]`)

## Step 3: Register the Export

Add the new evaluator to `js/index.ts`:

```typescript
export { default as MarkdownEvaluator } from './markdown-evaluator/MarkdownEvaluator.js';
```

## Step 4: Add Package Export (Optional)

If you want consumers to import via a subpath (`@nextcapital/copy-service/MarkdownEvaluator`), add to `package.json`:

```json
{
  "exports": {
    "./MarkdownEvaluator": "./ts-output/markdown-evaluator/MarkdownEvaluator.js",
    "./MarkdownEvaluator.js": "./ts-output/markdown-evaluator/MarkdownEvaluator.js"
  }
}
```

## Step 5: Write Tests

Follow the existing test patterns:

1. **Unit test** (`MarkdownEvaluator.test.ts`): Test each node type with mock ASTs
2. **Integration test** (`integration-tests/tests/MarkdownEvaluatorIntegration.test.ts`): Test full register → parse → evaluate with `integration-tests/copy.json`

See `js/plain-text-evaluator/PlainTextEvaluator.test.ts` for the canonical unit test pattern and `integration-tests/tests/PlainTextEvaluatorIntegration.test.ts` for the integration test pattern.

## Checklist

- [ ] Every `SyntaxNode` subclass is handled in `evalAST()` (9 types + unknown fallback)
- [ ] Caching pattern used: `getCached()` at top, `setCacheIfCacheable()` after sibling recursion
- [ ] `getInitialResult()` returns the appropriate "empty" value for your output type
- [ ] `allowFunctional` is respected in the Functional branch
- [ ] Export added to `js/index.ts`
- [ ] Unit tests cover all node types
- [ ] Integration tests use `integration-tests/copy.json`

## Evidence

- `js/plain-text-evaluator/PlainTextEvaluator.ts` — Canonical string evaluator
- `js/html-evaluator/HtmlEvaluator.ts` — Minimal subclass example (30 LOC)
- `js/react-evaluator/ReactEvaluator.ts` — Non-string evaluator example
- `js/copy-service/Evaluator/Evaluator.ts` — Abstract base class contract
