# Component: CopyService

## Identity

- **Type:** library module
- **Location:** `js/copy-service/CopyService.ts`
- **Architecture role:** domain core — owns copy registration, storage, and lazy parsing
- **Boundaries:** Owns the copy store (`_registeredCopy`). Delegates parsing to `Parser`. Does NOT evaluate copy — that is the evaluator's responsibility.

## Purpose

CopyService is the central store for registered copy — it receives raw JSON copy files, merges them, and provides on-demand parsing into ASTs that evaluators consume. It exists because copy must be registered from multiple sources (base copy, tenant overrides), merged deterministically, and parsed lazily for performance.

## Responsibilities

- Registers copy from JSON objects, merging new copy into existing copy
- Lazily parses raw copy strings into ASTs on first access via `getAstForKey()`
- Provides key lookup (`hasKey()`, `getSubkeys()`, `buildSubkeys()`)
- Returns registered copy in its original syntax form via `getRegisteredCopy()`
- Supports eager parsing via `parseAllCopy()` for validation

## Non-Responsibilities

- Does NOT evaluate ASTs — evaluators do that
- Does NOT handle language fallbacks — `IntlCopyService` wraps `CopyService` for that
- Does NOT load copy files — callers provide JSON objects

## Internal Structure

### Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `_registeredCopy` | `{ [key: string]: RegisteredCopyNode }` | Internal copy store — values are strings (unparsed), AST nodes (parsed), or nested objects |
| `language` | `string \| null` | Set when used by `IntlCopyService` — controls error behavior for missing keys |
| `errorOnMissingRefs` | `boolean` | When `true`, missing keys throw instead of returning `null` |

### Key Types

```typescript
// js/copy-service/CopyService.ts#L7-L24
export type AST = SyntaxNode | null;

export interface CopyFile {
  [key: string]: string | CopyFile;  // JSON copy input
}

export type RegisteredCopyNode = string | AST | {
  [key: string]: RegisteredCopyNode;  // Internal store type
};
```

## Interfaces

### Inbound (how other things call it)

| Method | Purpose | Called By |
|--------|---------|----------|
| `registerCopy(json)` | Store copy from JSON | Application code, `IntlCopyService` |
| `getAstForKey(key)` | Get parsed AST for a copy key | All evaluators via `getCopy()` |
| `hasKey(key)` | Check if a key exists | Application code |
| `getSubkeys(key)` | Get the subtree at a key | Application code, `IntlCopyService` |
| `buildSubkeys(key)` | Recursively build all subkey paths | Application code, `IntlCopyService` |
| `getRegisteredCopy()` | Get all registered copy in syntax form | Application code, `IntlCopyService` |
| `getRegisteredCopyForKey(key)` | Get syntax string for a specific key | Application code, `IntlCopyService` |
| `parseAllCopy()` | Eagerly parse all unparsed copy | Application code (validation) |

### Outbound (what it calls)

| Target | Method | Purpose |
|--------|--------|---------|
| `Parser` | `parseSingle(key, copy)` | Parse a single copy string on demand |
| `Parser` | `parseLeaves(tree)` | Parse all leaves in a tree (eager mode) |
| `SyntaxNode` | `isAST(node)` | Check if a value is an AST node |
| `ErrorHandler` | `handleError(...)` | Report errors for missing keys, bad formats |

## Data

- **Owned data:** The `_registeredCopy` store — a nested object where leaves are either raw strings (unparsed) or `SyntaxNode` instances (parsed)
- **Published data:** ASTs via `getAstForKey()`, syntax strings via `getRegisteredCopy()`

## How It Works

### Registration and Merging

When `registerCopy(json)` is called:

1. Validates input is a plain object — `js/copy-service/CopyService.ts#L60-L66`
2. Deep-clones the input to avoid mutating the caller's object — `js/copy-service/CopyService.ts#L69`
3. Merges into `_registeredCopy` via `_mergeParsedCopy()` — `js/copy-service/CopyService.ts#L214-L235`

The merge uses `lodash.mergeWith` with a custom handler: strings and AST nodes always **replace** existing values (never merge), while objects merge recursively. This is critical for tenant overrides — a tenant copy file can replace specific leaf strings without affecting sibling keys.

### Lazy Parsing

When `getAstForKey(key)` is called:

1. Retrieves the value at `key` from `_registeredCopy` using `lodash.get`
2. If the value is a **string**: parses it via `Parser.parseSingle()`, replaces the string in-place with the resulting AST, and returns the AST — `js/copy-service/CopyService.ts#L112-L119`
3. If the value is an **AST node**: returns it directly (already parsed)
4. If the value is `undefined` or not an AST: when `language` is not set, logs an error and returns `null`; when `language` is set, silently returns `undefined` (to allow `IntlCopyService` to continue fallback)

This in-place replacement means parsing only happens once per key. Subsequent access returns the cached AST.

## Cross-Cutting Concerns

- **Error handling:** Uses `ErrorHandler.handleError()` for all error reporting. The `halt` option controls whether errors throw or merely log.
- **Validation:** Input validation in `registerCopy()` checks for plain objects. Parse errors in `getAstForKey()` are caught and logged.

## Extension Patterns

To use `CopyService`, instantiate it and call `registerCopy()` with JSON copy objects. Use `parseAllCopy()` after registration if you want to validate all copy eagerly (recommended in test environments).

```typescript
const copyService = new CopyService({ errorOnMissingRefs: true });
copyService.registerCopy(baseCopy);
copyService.registerCopy(tenantOverrides); // merges on top
copyService.parseAllCopy(); // throws if any copy is invalid
```

## Evidence

- `js/copy-service/CopyService.ts#L30-L237` — Full class implementation
- `js/copy-service/CopyService.ts#L60-L72` — `registerCopy()` with validation and deep clone
- `js/copy-service/CopyService.ts#L107-L137` — `getAstForKey()` lazy parsing logic
- `js/copy-service/CopyService.ts#L214-L235` — `_mergeParsedCopy()` merge strategy
- `js/copy-service/CopyService.test.ts` — 440 LOC of unit tests
