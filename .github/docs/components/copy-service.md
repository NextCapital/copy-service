# Component: CopyService and IntlCopyService

`CopyService` is the central store for registered copy — it receives raw JSON copy files, merges them, and provides on-demand parsing into ASTs that evaluators consume. `IntlCopyService` wraps one `CopyService` per language and falls back through a parent-language hierarchy when a translation is missing. Both share the same public API, so evaluators work with either polymorphically.

## Responsibilities

- Registers copy from JSON objects, merging new copy into existing copy
- Lazily parses raw copy strings into ASTs on first access via `getAstForKey()`
- Provides key lookup (`hasKey()`, `getSubkeys()`, `buildSubkeys()`)
- Returns registered copy in its original syntax form via `getRegisteredCopy()`
- Supports eager parsing via `parseAllCopy()` for validation
- (`IntlCopyService`) Maintains a language hierarchy and resolves copy through fallback

## How It Works

### Registration and Merging

When `registerCopy(json)` is called:

1. Validates input is a plain object
2. Deep-clones the input to avoid mutating the caller's object
3. Merges into `_registeredCopy` via `_mergeParsedCopy()`

The merge uses `lodash.mergeWith` with a custom handler: strings and AST nodes always **replace** existing values (never merge), while objects merge recursively. This is critical for tenant overrides — a tenant copy file can replace specific leaf strings without affecting sibling keys.

### Lazy Parsing

When `getAstForKey(key)` is called:

1. Retrieves the value at `key` from `_registeredCopy` using `lodash.get`
2. If the value is a **string**: parses it via `Parser.parseSingle()`, replaces the string in-place with the resulting AST, and returns the AST
3. If the value is an **AST node**: returns it directly (already parsed)
4. If the value is `undefined` or not an AST: when `language` is not set, logs an error and returns `null`; when `language` is set, silently returns `undefined` (to allow `IntlCopyService` to continue fallback)

This in-place replacement means parsing only happens once per key. Subsequent access returns the cached AST.

### Language Hierarchy (IntlCopyService)

`_getHierarchy(language)` is a generator that yields languages from most-specific to most-general (avoids array allocations for performance). Two methods use this generator:

- **`_getFromHierarchy`** — Calls a method on each `CopyService` in the hierarchy, returning the first result that passes a skip predicate. Used by `getAstForKey()`, `hasKey()`, and `getRegisteredCopyForKey()`.
- **`_mergeFromHierarchy`** — Calls a method on ALL services and merges results with `lodash.merge` (root as base, specific languages override). Used by `buildSubkeys`, `getSubkeys`, `getRegisteredCopy`.

When `IntlCopyService.getAstForKey(key)` is called:

1. Walks the hierarchy from leaf to root via the generator
2. For each language, calls `CopyService.getAstForKey(key)`
3. `CopyService` returns `undefined` (not `null`) when `language` is set and the key is missing — this signals "try parent"
4. Returns the first non-`undefined` result
5. If all languages return `undefined`, logs an error and returns `null`

The `undefined` vs `null` distinction is critical:
- `undefined` = "key not found in this language, try parent"
- `null` = "key found but parse failed"

## Usage

```typescript
// Single-language
const copyService = new CopyService({ errorOnMissingRefs: true });
copyService.registerCopy(baseCopy);
copyService.registerCopy(tenantOverrides); // merges on top
copyService.parseAllCopy(); // throws if any copy is invalid

// Multi-language
const intlService = new IntlCopyService('en-us', {
  'en-us': null,           // root
  'spanish': 'en-us',     // falls back to en-us
  'portuguese': 'spanish'  // falls back to spanish → en-us
});
intlService.registerCopy(englishCopy, 'en-us');
intlService.registerCopy(spanishCopy, 'spanish');
```
