# Copy Service — Copilot Instructions

This is `@nextcapital/copy-service`, a TypeScript library for UI copy management and i18n. It parses a custom DSL into ASTs and evaluates them into plain text, HTML, or React JSX.

## Documentation Routing Table

Use this table to find the right doc for a given question or task:

| Question / Topic | Document |
|-----------------|----------|
| Architecture overview, key concepts, design decisions | [docs/README.md](.github/docs/README.md) |
| CopyService API, registration, merging, lazy parsing | [docs/components/copy-service.md](.github/docs/components/copy-service.md) |
| IntlCopyService, language hierarchy, fallback behavior | [docs/components/copy-service.md](.github/docs/components/copy-service.md) |
| Parser, tokenizer, grammar, recursive descent | [docs/components/parser.md](.github/docs/components/parser.md) |
| Evaluators (base, PlainText, HTML, React) | [docs/components/evaluators.md](.github/docs/components/evaluators.md) |
| DSL syntax (`${}`, `#{}`, `%{}`, `*{}{}{}`, `^{}{}`, `<tag>`) | [docs/guides/dsl-reference.md](.github/docs/guides/dsl-reference.md) |
| End-to-end evaluation flow (register → parse → evaluate) | [docs/flows/copy-evaluation.md](.github/docs/flows/copy-evaluation.md) |
| Language hierarchy resolution and fallback | [docs/flows/intl-fallback.md](.github/docs/flows/intl-fallback.md) |
| Caching strategy (parse cache + evaluation WeakMap) | [docs/flows/caching.md](.github/docs/flows/caching.md) |
| Building a custom evaluator | [docs/guides/tutorial-new-evaluator.md](.github/docs/guides/tutorial-new-evaluator.md) |
| Glossary of proprietary terms | [docs/guides/glossary.md](.github/docs/guides/glossary.md) |
| Developer onboarding | [docs/onboarding/onboarding.md](.github/docs/onboarding/onboarding.md) |

## Key Commands

- `npm test` — unit + integration tests (Jest)
- `npm run lint` — ESLint + cspell + markdownlint
- `npm run tsc` — type-check and compile to `ts-output/`
- `npm run ci:local` — full CI pipeline (lint → test → tsc → tsc:test)

## Project Structure

```
js/
  index.ts                          — package entry point (re-exports)
  copy-service/
    CopyService.ts                  — copy registration, lazy parsing
    IntlCopyService.ts              — multi-language wrapper
    Parser/Parser.ts                — tokenizer + recursive-descent parser
    SyntaxNode/SyntaxNode.ts        — AST base class
    Evaluator/Evaluator.ts          — abstract evaluator base
    Substitutions/Substitutions.ts  — runtime value resolution
    ErrorHandler/ErrorHandler.ts    — centralized error handling
    <NodeType>/<NodeType>.ts        — AST node subclasses
  plain-text-evaluator/             — string output evaluator
  html-evaluator/                   — HTML output evaluator
  react-evaluator/                  — React JSX output evaluator
integration-tests/                  — full register → parse → evaluate tests
```

## Conventions

- Each source file has a co-located `.test.ts` file
- Integration tests live in `integration-tests/` and exercise full register → parse → evaluate flows
- 100% function coverage required
- ESM-only (`ts-output/` published to npm)
- `lodash` for deep operations (merge, get, result)
- `null` = valid empty AST; `undefined` = "not found" signal for IntlCopyService fallback
