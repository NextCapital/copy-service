# DSL Syntax Reference

## Overview

The Copy Service DSL defines the syntax for copy strings stored in JSON files. The DSL exists because copy is stored as data (JSON), not executable code — template literals are not available.

## Syntax Summary

| Syntax | Name | Purpose | Example |
|--------|------|---------|---------|
| `${key}` | [Reference](#reference) | Include copy from another key | `${account.name}` |
| `${..key}` | [Relative Reference](#relative-references) | Reference relative to current key | `${..sibling}` |
| `#{key}` | [Substitution](#substitution) | Interpolate a runtime value | `#{userName}` |
| `%{key}` | [Ref Substitution](#ref-substitution) | Reference a copy key from substitutions | `%{dynamicKey}` |
| `*{L}{R}{key}` | [Switch](#switch) | Conditional: truthy=L, falsy=R | `*{item}{items}{count}` |
| `^{copy}{fn}` | [Functional](#functional) | Pass copy through a function | `^{click here}{makeLink}` |
| `^{copy}{fn}[args]` | [Functional with args](#functional-with-arguments) | Functional with extra arguments | `^{text}{fn}[a, b]` |
| `<tag>copy</tag>` | [Formatting](#formatting) | HTML formatting tag | `<strong>bold</strong>` |
| `\n` | Newline | Line break (evaluator-dependent) | — |
| `\b` | Word break | Word break hint | — |

## Reference

**Syntax:** `${copy.key.path}`

Includes the evaluated copy from another key. Works recursively — the referenced copy can itself contain references.

```json
{
  "greeting": "Hello",
  "welcome": "${greeting}, welcome!"
}
```

`welcome` evaluates to `"Hello, welcome!"`

### Relative References

References support relative paths using `.` prefixes, similar to file paths:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `${.sibling}` | Same parent | From `a.b.c`, resolves to `a.b.sibling` |
| `${..uncle}` | One level up | From `a.b.c`, resolves to `a.uncle` |
| `${...root}` | Two levels up | From `a.b.c.d`, resolves to `a.root` |

```json
{
  "section": {
    "intro": "Welcome to ${.detail.name}",
    "detail": {
      "name": "the app"
    }
  }
}
```

`section.intro` evaluates to `"Welcome to the app"`

**Implementation:** Parser resolves relative paths to absolute paths at parse time using `_getRelativeKey()` — `js/copy-service/Parser/Parser.ts#L372-L396`

## Substitution

**Syntax:** `#{substitution.key.path}`

Interpolates a runtime value from the substitutions object passed to `getCopy()`.

```json
{ "balance": "Your balance is #{amount}" }
```

```typescript
evaluator.getCopy('balance', { amount: '$1,234.56' });
// → "Your balance is $1,234.56"
```

Supports deep key paths: `#{user.profile.name}` accesses `substitutions.user.profile.name`.

**Important:** `#{}` interpolates substitutions. `${}` references other copy keys. These are NOT interchangeable.

### Lazy Substitution Functions

Individual substitution values can be functions — they are called automatically on access:

```typescript
evaluator.getCopy('balance', {
  amount: () => expensiveFormatting(rawAmount) // called only if #{amount} is in the copy
});
```

The entire substitutions object can also be a function:

```typescript
evaluator.getCopy('balance', () => ({
  amount: computedValue // function called only when a substitution is needed
}));
```

## Ref Substitution

**Syntax:** `%{substitutionKey}`

A two-level indirection: reads a copy key name from substitutions, then evaluates that key's copy.

```json
{
  "checking": "Checking Account",
  "savings": "Savings Account",
  "display": "%{accountType}"
}
```

```typescript
evaluator.getCopy('display', { accountType: 'checking' });
// → "Checking Account"
evaluator.getCopy('display', { accountType: 'savings' });
// → "Savings Account"
```

**Note:** Relative references are NOT supported inside `%{}`.

## Switch

**Syntax:** `*{left}{right}{deciderKey}`

Conditional branching based on a substitution value. Evaluates `left` if truthy, `right` if falsy.

```json
{ "items": "*{1 item}{#{count} items}{count}" }
```

```typescript
evaluator.getCopy('items', { count: 1 });  // → "1 item"
evaluator.getCopy('items', { count: 5 });  // → "5 items"
evaluator.getCopy('items', { count: 0 });  // → "0 items"
```

### Boolean Evaluation Rules

The decider value uses `Substitutions.getBoolean()`:

| Value | Result | Branch |
|:---:|:---:|:---:|
| `1` | `true` | Left (singular) |
| `0`, `2`, `3`, ... | `false` | Right (plural) |
| `true` | `true` | Left |
| `false`, `null`, `undefined`, `''` | `false` | Right |
| Non-empty string | `true` | Left |

**Key insight:** The number `1` is "singular" (left), ALL other numbers are "plural" (right). This is intentional for pluralization — `*{account}{accounts}{count}`.

### Nested Switch

Branches can contain any DSL syntax, including other switches and references:

```json
{ "nested": "*{${refs.optionA}}{#{sub}}{decider}" }
```

## Functional

**Syntax:** `^{inner copy}{functionKey}`

Passes evaluated inner copy through a function from substitutions. The function receives the evaluated copy string (or React node) as its first argument.

```json
{ "link": "Visit our ^{website}{makeLink}" }
```

```typescript
// PlainTextEvaluator (with allowFunctional: true)
evaluator.getCopy('link', {
  makeLink: (copy) => `<a href="https://example.com">${copy}</a>`
});
// → "Visit our <a href=\"https://example.com\">website</a>"

// ReactEvaluator
evaluator.getCopy('link', {
  makeLink: (copy) => React.createElement('a', { href: 'https://example.com' }, copy)
});
// → <Fragment>Visit our <a href="https://example.com">website</a></Fragment>
```

### Functional with Arguments

**Syntax:** `^{inner copy}{functionKey}[arg1, arg2]`

Extra arguments are passed as strings after the copy:

```json
{ "link": "^{click here}{makeLink}[https://example.com, _blank]" }
```

```typescript
evaluator.getCopy('link', {
  makeLink: (copy, url, target) => `<a href="${url}" target="${target}">${copy}</a>`
});
```

**Important:** Arguments are always strings. The boolean `true` in `[true]` is the string `'true'`.

### `allowFunctional` Option

When `allowFunctional` is `false` (set on the evaluator constructor), functional syntax returns the inner copy WITHOUT calling the function:

```typescript
const evaluator = new PlainTextEvaluator(copyService, { allowFunctional: false });
evaluator.getCopy('link', { makeLink: (copy) => copy + '!' });
// → "Visit our website"  (function not called)
```

## Formatting

**Syntax:** `<tag>content</tag>`

HTML formatting tags. Behavior depends on the evaluator:

| Evaluator | Output |
|-----------|--------|
| PlainTextEvaluator | `"content"` (tags stripped) |
| HtmlEvaluator | `"<tag>content</tag>"` (tags preserved) |
| ReactEvaluator | `React.createElement(tag, null, content)` |

### Allowed Tags

`<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<s>`, `<sup>`, `<sub>`, `<p>`, `<span>`, `<div>`, `<ol>`, `<ul>`, `<li>`

Invalid tags (e.g., `<q>`, `<script>`) throw a parse error.

### Nesting

Tags can be nested and combined with other syntax:

```json
{ "bold_ref": "<strong><em>${some.key}</em></strong>" }
```

## Escaping

Special characters (`${`, `#{`, `%{`, `*{`, `^{`) can be escaped with a backslash to produce literal text:

```json
{ "literal": "Use \\${key} to reference copy" }
```

Evaluates to: `"Use ${key} to reference copy"`

## Newline and Word Break

| Syntax | PlainText | HTML | React |
|--------|-----------|------|-------|
| `\n` (literal newline in JSON) | `\n` | `<br/>` | `<br>` element |
| `\b` (backspace char in JSON) | (empty) | `<wbr/>` | `<wbr>` element |

Word breaks (`\b`) hint to the browser where long words can be broken. They produce no visible output in plain text.

## Grammar (Formal)

For the formal grammar and parser design rationale, see [component-003-parser.md](component-003-parser.md#grammar).

## Evidence

- `README.md#L100-L200` — DSL syntax documentation with examples
- `js/copy-service/Parser/Parser.ts#L38-L55` — Token definitions
- `js/copy-service/Parser/Parser.ts#L87-L90` — Allowed HTML tags
- `js/copy-service/Substitutions/Substitutions.ts#L97-L107` — `getBoolean()` rules
- `integration-tests/copy.json` — Reference copy file exercising all syntax
