# Runtime Flow: IntlCopyService Language Hierarchy Fallback

## Trigger

- **Type:** API call from application code
- **Location:** `evaluator.getCopy(key, subs)` where the evaluator uses an `IntlCopyService` — `js/copy-service/Evaluator/Evaluator.ts#L73`

## Narrative

This flow shows how `IntlCopyService` resolves a copy key through the language hierarchy when the current language doesn't have the key.

**Setup:**

```typescript
const hierarchy = {
  "en-us": null,        // root
  "portuguese": "spanish",
  "spanish": "en-us"
};
const intlService = new IntlCopyService("portuguese", hierarchy);
intlService.registerCopy(englishCopy, "en-us");
intlService.registerCopy(spanishCopy, "spanish");
intlService.registerCopy(portugueseCopy, "portuguese");
```

**Resolution for a key missing in Portuguese but present in English:**

1. Evaluator calls `intlService.getAstForKey(key)` — `js/copy-service/IntlCopyService.ts#L139`
2. `getAstForKey()` calls `_getFromHierarchy('portuguese', 'getAstForKey', skipIfUndefined, key)` — `js/copy-service/IntlCopyService.ts#L141-L145`
3. `_getFromHierarchy()` starts the `_getHierarchy('portuguese')` generator — `js/copy-service/IntlCopyService.ts#L249`
4. Generator yields `'portuguese'` — `js/copy-service/IntlCopyService.ts#L211`
5. Calls `portugueseService.getAstForKey(key)` → returns `undefined` (key not found) — `js/copy-service/CopyService.ts#L127-L131`
6. `undefined` passes the skip predicate (`_.isUndefined`) → continue — `js/copy-service/IntlCopyService.ts#L143`
7. Generator yields `'spanish'` — `js/copy-service/IntlCopyService.ts#L215`
8. Calls `spanishService.getAstForKey(key)` → returns `undefined` (key not found)
9. Generator yields `'en-us'` — `js/copy-service/IntlCopyService.ts#L215`
10. Calls `englishService.getAstForKey(key)` → returns the AST (key found, lazily parsed)
11. `undefined` check fails (result is an AST) → return the AST — `js/copy-service/IntlCopyService.ts#L252`
12. If ALL languages returned `undefined`: logs error, returns `null` — `js/copy-service/IntlCopyService.ts#L149-L155`

## Sequence Diagram

```d2
shape: sequence_diagram

eval: Evaluator
intl: IntlCopyService
pt: "CopyService\n(portuguese)"
es: "CopyService\n(spanish)"
en: "CopyService\n(en-us)"

eval -> intl: "getAstForKey(key)"
intl -> pt: "getAstForKey(key)"
pt -> intl: "undefined (not found)" {style.stroke-dash: 3}
intl -> es: "getAstForKey(key)"
es -> intl: "undefined (not found)" {style.stroke-dash: 3}
intl -> en: "getAstForKey(key)"
en -> intl: "AST" {style.stroke-dash: 3}
intl -> eval: "AST" {style.stroke-dash: 3}
```

## Hierarchy Methods

IntlCopyService has two hierarchy traversal strategies:

### `_getFromHierarchy` (first-match)

Used by: `getAstForKey`, `hasKey`, `getRegisteredCopyForKey`

Walks the hierarchy leaf-to-root, returning the first result that passes the skip predicate.

### `_mergeFromHierarchy` (merge-all)

Used by: `buildSubkeys`, `getSubkeys`, `getRegisteredCopy`

Calls the method on ALL services in the hierarchy, then merges results using `lodash.merge` with root as base and specific languages overriding. Used when you need the complete picture (e.g., all subkeys across all languages).

**Optimization:** When the current language IS the root (parent = `null`), `_mergeFromHierarchy` skips the array construction and merge, calling the method directly on the root service. — `js/copy-service/IntlCopyService.ts#L229-L231`

## The `undefined` vs `null` Protocol

The `undefined`/`null` distinction is critical:

| Return Value | Meaning | Who Produces It |
|:---:|---|---|
| `undefined` | "Key not found in this language — try parent" | `CopyService.getAstForKey()` when `language` is set |
| `null` | "Key found but parse failed" | `CopyService.getAstForKey()` |
| `SyntaxNode` | "Key found and parsed successfully" | `CopyService.getAstForKey()` |

`CopyService` returns `undefined` (instead of logging an error and returning `null`) specifically when its `language` property is set. This signals to `IntlCopyService` that the key was simply not registered for this particular language — not that it's globally missing.

## Evidence

- `js/copy-service/IntlCopyService.ts#L139-L158` — `getAstForKey()` with hierarchy resolution
- `js/copy-service/IntlCopyService.ts#L197-L220` — `_getHierarchy()` generator
- `js/copy-service/IntlCopyService.ts#L241-L258` — `_getFromHierarchy()` first-match traversal
- `js/copy-service/IntlCopyService.ts#L226-L240` — `_mergeFromHierarchy()` merge-all traversal
- `js/copy-service/CopyService.ts#L127-L131` — `undefined` return when `language` is set
- `integration-tests/tests/IntlCopyServiceHierarchy.test.ts` — Hierarchy fallback integration tests
