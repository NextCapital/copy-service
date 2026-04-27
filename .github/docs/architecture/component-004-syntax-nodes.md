# Component: SyntaxNode and AST Node Types

## Identity

- **Type:** library module (base class + 9 subclasses)
- **Location:** `js/copy-service/SyntaxNode/SyntaxNode.ts` (base), `js/copy-service/<Name>/<Name>.ts` (subclasses)
- **Architecture role:** domain core — the AST data model
- **Boundaries:** AST nodes are pure data structures with cacheability checks and syntax reconstruction. They do NOT parse or evaluate themselves — the Parser creates them and Evaluators interpret them.

## Purpose

SyntaxNode and its subclasses form the AST between raw DSL strings and evaluated output, letting multiple evaluators reuse the same parsed representation without re-parsing.

## Base Class: SyntaxNode

```typescript
// js/copy-service/SyntaxNode/SyntaxNode.ts
class SyntaxNode {
  static isAST(maybeNode: unknown): maybeNode is SyntaxNode | null;
  static safeToSyntax(node: SyntaxNode | null): string;
  toSyntax(): string;          // Convert back to DSL syntax (override in subclasses)
  isCacheable(copyService): boolean;  // Can evaluation be cached? (override in subclasses)
}
```

**Key design:** `null` is a valid AST. `SyntaxNode.isAST(null)` returns `true`. This means "empty copy" is `null`, not an empty node. The `safeToSyntax` helper converts `null` to `''`.

## AST Node Types

All nodes share a common structure: each has a `sibling` property (the next node in the linked list) and node-specific data properties. The `sibling` chain forms the horizontal structure; node-specific properties form the vertical structure.

### Verbatim

**Why it exists:** Represents literal text that requires no interpolation or transformation.

| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | The literal text content |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** Yes (if sibling is cacheable)
- **DSL syntax:** Any text not matching a special token
- **Location:** `js/copy-service/Verbatim/Verbatim.ts`

### Reference

**Why it exists:** Includes copy from another key, enabling copy reuse without duplication. Supports relative paths via `.` prefix.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Absolute copy key to reference (trimmed) |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** Yes (if the referenced AST and sibling are both cacheable)
- **DSL syntax:** `${some.copy.key}` or `${..relative.key}`
- **Location:** `js/copy-service/Reference/Reference.ts`

### Substitute

**Why it exists:** Interpolates a runtime value from the substitutions object. This is how dynamic data (names, amounts, dates) enters copy.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Path on the substitutions object (trimmed) |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** No (always depends on runtime substitutions)
- **DSL syntax:** `#{substitution.key}`
- **Location:** `js/copy-service/Substitute/Substitute.ts`

### RefSubstitute

**Why it exists:** A two-level indirection — reads a copy key name from substitutions, then resolves that key. This allows the substitutions object to control which copy key is referenced at runtime.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Path on substitutions that contains a copy key (trimmed) |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** No (depends on runtime substitutions)
- **DSL syntax:** `%{substitutionKey}`
- **Location:** `js/copy-service/RefSubstitute/RefSubstitute.ts`

### Switch

**Why it exists:** Provides conditional logic (ternary) within copy. Primarily used for pluralization (`1` = singular/left, other numbers = plural/right) and boolean branching.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Path on substitutions for the decider (trimmed) |
| `left` | `SyntaxNode \| null` | AST for truthy/singular branch |
| `right` | `SyntaxNode \| null` | AST for falsy/plural branch |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** No (depends on runtime substitutions)
- **DSL syntax:** `*{left text}{right text}{deciderKey}`
- **Location:** `js/copy-service/Switch/Switch.ts`

**Important:** The decider uses `Substitutions.getBoolean()`, which treats the number `1` as truthy and all other numbers as falsy. This is intentional for pluralization — `1` item = singular (left), `0` or `2+` items = plural (right).

### Functional

**Why it exists:** Enables arbitrary transformations on copy by calling a user-provided function from substitutions. Used for links, custom formatting, and complex interpolation that DSL syntax alone cannot express.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Path on substitutions to the function (trimmed) |
| `copy` | `SyntaxNode \| null` | AST passed as first argument to the function |
| `args` | `string[]` | Additional string arguments |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** No (calls a runtime function)
- **DSL syntax:** `^{inner copy}{functionKey}` or `^{inner copy}{functionKey}[arg1, arg2]`
- **Controlled by:** `Evaluator.allowFunctional` — when `false`, the function is not called and the inner copy is returned as-is
- **Location:** `js/copy-service/Functional/Functional.ts`

### Formatting

**Why it exists:** Represents HTML tags in copy. Different evaluators render these differently — `PlainTextEvaluator` strips them, `HtmlEvaluator` keeps them as HTML strings, `ReactEvaluator` converts them to React elements.

| Property | Type | Description |
|----------|------|-------------|
| `tag` | `string` | HTML tag name (validated against allowlist) |
| `copy` | `SyntaxNode \| null` | AST representing the tag's content |
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** Yes (if copy and sibling are both cacheable)
- **DSL syntax:** `<strong>text</strong>`
- **Location:** `js/copy-service/Formatting/Formatting.ts`

### Newline

**Why it exists:** Represents a newline character. Different evaluators render it differently — plain text uses `\n`, HTML uses `<br/>`, React uses `<br>` element.

| Property | Type | Description |
|----------|------|-------------|
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** Yes (if sibling is cacheable)
- **DSL syntax:** literal `\n` in copy string
- **Location:** `js/copy-service/Newline/Newline.ts`

### WordBreak

**Why it exists:** Provides word-break hints for long words. HTML/React render as `<wbr/>`, plain text ignores it. Useful for allowing browsers to break long compound words.

| Property | Type | Description |
|----------|------|-------------|
| `sibling` | `SyntaxNode \| null` | Next node |

- **Cacheable:** Yes (if sibling is cacheable)
- **DSL syntax:** `\b` in copy string (NOT a regex word boundary — custom DSL syntax)
- **Location:** `js/copy-service/WordBreak/WordBreak.ts`

## Cacheability Rules

Cacheability determines whether an evaluator can skip re-evaluation on subsequent calls. The rules:

| Node Type | Cacheable? | Reason |
|-----------|-----------|--------|
| Verbatim | Yes* | Static text never changes |
| Reference | Yes* | If the referenced AST is also cacheable |
| Formatting | Yes* | If inner copy is cacheable |
| Newline | Yes* | Static output |
| WordBreak | Yes* | Static output |
| Substitute | **No** | Depends on runtime substitutions |
| RefSubstitute | **No** | Depends on runtime substitutions |
| Switch | **No** | Depends on runtime substitutions |
| Functional | **No** | Calls a runtime function |

\* — Also requires sibling to be cacheable. If any node in the sibling chain is uncacheable, the entire chain from that point is uncacheable.

## AST Structure Example

Copy string: `Hello #{name}, you have *{one}{#{count}}{count} items`

```text
Verbatim("Hello ")
  └─ sibling → Substitute("name")
                  └─ sibling → Verbatim(", you have ")
                                  └─ sibling → Switch(key="count")
                                                  ├─ left → Verbatim("one")
                                                  ├─ right → Substitute("count")
                                                  └─ sibling → Verbatim(" items")
```

## Evidence

- `js/copy-service/SyntaxNode/SyntaxNode.ts#L1-L57` — Base class
- `js/copy-service/Verbatim/Verbatim.ts` — Verbatim implementation
- `js/copy-service/Reference/Reference.ts` — Reference implementation with cacheability check
- `js/copy-service/Substitute/Substitute.ts` — Substitute (never cacheable)
- `js/copy-service/RefSubstitute/RefSubstitute.ts` — RefSubstitute
- `js/copy-service/Switch/Switch.ts` — Switch with left/right branches
- `js/copy-service/Functional/Functional.ts` — Functional with args support
- `js/copy-service/Formatting/Formatting.ts` — Formatting with tag property
- `js/copy-service/Newline/Newline.ts` — Newline
- `js/copy-service/WordBreak/WordBreak.ts` — WordBreak
