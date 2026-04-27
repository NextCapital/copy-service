# Component: IntlCopyService

## Identity

- **Type:** library module
- **Location:** `js/copy-service/IntlCopyService.ts`
- **Architecture role:** domain core — multi-language orchestration layer
- **Boundaries:** Owns the language hierarchy and per-language `CopyService` instances. Does NOT parse or evaluate copy directly — delegates to `CopyService` instances and evaluators.

## Purpose

IntlCopyService wraps one `CopyService` per language and falls back through a parent-language hierarchy when a translation is missing.

## Responsibilities

- Maintains a hierarchy of languages with parent-child fallback relationships
- Creates and manages one `CopyService` per language in the hierarchy
- Resolves copy requests by walking the hierarchy from most-specific to most-general language
- Provides the same public API as `CopyService` for polymorphic use with evaluators

## Non-Responsibilities

- Does NOT parse copy — delegates to per-language `CopyService` instances
- Does NOT detect the user's language — the caller provides the language
- Does NOT load language-specific copy files — the caller provides them

## How It Works

### Hierarchy Traversal

Two internal methods handle hierarchy resolution:

**`_getHierarchy(language)`** — A generator that yields languages from most-specific to most-general. For `'portuguese'` with the example hierarchy above, it yields: `'portuguese'`, `'spanish'`, `'en-us'`.

The generator avoids array allocations — critical for `getAstForKey()` which is called frequently during page renders. — `js/copy-service/IntlCopyService.ts#L208-L220`

**`_getFromHierarchy(language, method, skip, ...args)`** — Calls a method on each `CopyService` in the hierarchy, returning the first result not skipped by the `skip` predicate. Used by `getAstForKey()` (skip `undefined`), `hasKey()` (skip falsy), and `getRegisteredCopyForKey()` (skip `null`/`undefined`/`undefined`). — `js/copy-service/IntlCopyService.ts#L271-L291`

**`_mergeFromHierarchy(language, method, ...args)`** — Calls a method on each `CopyService` and merges results using `lodash.merge`, with root language results as the base and specific languages overriding. Optimizes the root language case (no merging needed). — `js/copy-service/IntlCopyService.ts#L248-L269`

### getAstForKey Resolution

1. Walks the hierarchy from leaf to root via the generator
2. For each language, calls `CopyService.getAstForKey(key)`
3. `CopyService` returns `undefined` (not `null`) when `language` is set and the key is missing — this signals "try parent"
4. Returns the first non-`undefined` result
5. If all languages return `undefined`, logs an error and returns `null`

This design means `undefined` vs `null` carries semantic meaning:
- `undefined` = "key not found in this language, try parent"
- `null` = "key found but parse failed (exception in Parser)"

## Cross-Cutting Concerns

- **Error handling:** Validates language exists in hierarchy before `setLanguage()`. Reports missing keys only after exhausting the full hierarchy.

## Evidence

- `js/copy-service/IntlCopyService.ts#L1-L293` — Full implementation
- `js/copy-service/IntlCopyService.ts#L25-L47` — Class-level JSDoc with hierarchy example
- `js/copy-service/IntlCopyService.ts#L197-L220` — Generator-based hierarchy traversal
- `js/copy-service/IntlCopyService.ts#L248-L291` — `_mergeFromHierarchy` and `_getFromHierarchy`
- `js/copy-service/IntlCopyService.test.ts` — 489 LOC of unit tests
- `integration-tests/tests/IntlCopyServiceHierarchy.test.ts` — Hierarchy integration tests
- `integration-tests/tests/IntlCopyServiceBasicCompatibility.test.ts` — API compatibility tests
