# Runtime Flow: IntlCopyService Language Hierarchy Fallback

This flow shows how `IntlCopyService` resolves a copy key through the language hierarchy when the current language doesn't have the key.

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

## Sequence



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

1. Evaluator calls `intlService.getAstForKey(key)`
2. `getAstForKey()` calls `_getFromHierarchy('portuguese', 'getAstForKey', skipIfUndefined, key)`
3. `_getFromHierarchy()` starts the `_getHierarchy('portuguese')` generator
4. Generator yields `'portuguese'`
5. Calls `portugueseService.getAstForKey(key)` → returns `undefined` (key not found)
6. `undefined` passes the skip predicate (`_.isUndefined`) → continue
7. Generator yields `'spanish'`
8. Calls `spanishService.getAstForKey(key)` → returns `undefined` (key not found)
9. Generator yields `'en-us'`
10. Calls `englishService.getAstForKey(key)` → returns the AST (key found, lazily parsed)
11. `undefined` check fails (result is an AST) → return the AST
12. If ALL languages returned `undefined`: logs error, returns `null`

## The `undefined` vs `null` Protocol

The `undefined`/`null` distinction is critical:

| Return Value | Meaning |
|:---:|---|
| `undefined` | "Key not found in this language — try parent" |
| `null` | "Key found but parse failed" |
| `SyntaxNode` | "Key found and parsed successfully" |

`CopyService` returns `undefined` (instead of logging an error and returning `null`) specifically when its `language` property is set. This signals to `IntlCopyService` that the key was simply not registered for this particular language — not that it's globally missing.
