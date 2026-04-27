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

## Internal Structure

### Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `_hierarchy` | `LanguageHierarchy` | Maps each language to its parent (or `null` for root languages) |
| `_services` | `Record<string, CopyService>` | One `CopyService` per language |
| `language` | `string` | Currently active language |
| `errorOnMissingRefs` | `boolean` | When `true`, missing keys throw after exhausting the hierarchy |

### Key Types

```typescript
// js/copy-service/IntlCopyService.ts#L10-L12
export interface LanguageHierarchy {
  [language: string]: string | null;  // language → parent language (null = root)
}
```

### Language Hierarchy Example

```typescript
// From the class-level JSDoc at js/copy-service/IntlCopyService.ts#L29-L37
const hierarchy = {
  "en-us": null,        // root language
  "en-uk": "en-us",     // falls back to en-us
  "spanish": "en-us",   // falls back to en-us
  "portuguese": "spanish", // falls back to spanish → en-us
  "german": null         // independent root
};
```

## Interfaces

### Inbound (how other things call it)

Every method mirrors `CopyService` with an optional trailing `language` parameter:

| Method | Purpose | Difference from CopyService |
|--------|---------|---------------------------|
| `setLanguage(lang)` | Change the active language | N/A — IntlCopyService only |
| `getLanguageService(lang?)` | Get the underlying CopyService for a language | N/A — IntlCopyService only |
| `registerCopy(json, lang?)` | Register copy for a specific language | Routes to per-language CopyService |
| `getAstForKey(key, lang?)` | Get AST, walking hierarchy | Returns first non-undefined result from hierarchy |
| `hasKey(key, lang?)` | Check key existence across hierarchy | Returns `true` if ANY language in hierarchy has the key |
| `buildSubkeys(key, lang?)` | Build subkeys, merged across hierarchy | Merges results from all languages in hierarchy |
| `getSubkeys(key, lang?)` | Get subtree, merged across hierarchy | Merges results from all languages in hierarchy |
| `getRegisteredCopy(lang?)` | Get all copy, merged across hierarchy | Merges copy from all languages in hierarchy |
| `getRegisteredCopyForKey(key, lang?)` | Get syntax for key across hierarchy | Returns first non-null result from hierarchy |
| `parseAllCopy()` | Parse all copy for all languages | Calls `parseAllCopy()` on every CopyService |

### Outbound (what it calls)

| Target | Method | Purpose |
|--------|--------|---------|
| `CopyService` | All public methods | Per-language delegation |
| `ErrorHandler` | `handleError(...)` | Report errors for unknown languages, missing keys |

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
