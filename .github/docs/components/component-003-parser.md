# Component: Parser

## Identity

- **Type:** library module (static utility class)
- **Location:** `js/copy-service/Parser/Parser.ts`
- **Architecture role:** domain core — transforms DSL strings into ASTs
- **Boundaries:** Owns tokenization and parsing. Produces `SyntaxNode` trees. Does NOT own copy storage (that's `CopyService`) or evaluation (that's evaluators).

## Purpose

The Parser transforms raw copy strings written in the Copy Service DSL into Abstract Syntax Trees (ASTs) of `SyntaxNode` subclasses. It exists because copy is authored as human-readable strings in JSON files, but must be structured data for evaluators to process efficiently.

## Responsibilities

- Tokenizes DSL strings into an array of typed tokens
- Parses token arrays into ASTs using recursive descent
- Resolves relative key references (`.` and `..` prefix syntax)
- Validates HTML tags against an allowlist
- Provides both single-string and batch parsing

## Non-Responsibilities

- Does NOT store parsed results — `CopyService` owns the cache
- Does NOT evaluate ASTs — evaluators do that
- Does NOT validate copy key existence — only syntactic parsing

## How It Works

### Tokenization (`_tokenize`)

The tokenizer scans the input string character-by-character:

1. Checks for each non-text token at the current position — `js/copy-service/Parser/Parser.ts#L149-L175`
2. Handles backslash escaping: if the last TEXT token ends with `\`, the special character is treated as literal text — `js/copy-service/Parser/Parser.ts#L161-L164`
3. Tracks `withinArgs` state to handle `,` and `]` only inside argument lists
4. Matches HTML tags via regex (`HTML_START_TAG_REGEX`, `HTML_END_TAG_REGEX`) and validates against the allowlist
5. Adjacent text characters are concatenated into a single TEXT token to minimize token count

### Parsing (`_parseTokens`)

The parser is recursive descent with two modes:

- **Unrestricted:** Parses until tokens are exhausted (top-level copy)
- **Restricted:** Parses until a specific ending token is found (`}{` for switch branches, `</tag>` for HTML)

For each token type, the parser:

1. Consumes the opening token
2. Recursively parses any inner content (branches, copy, arguments)
3. Constructs the appropriate `SyntaxNode` subclass
4. Recursively parses the remaining tokens to build the sibling chain

Example for `*{left}{right}{key}`:
1. Consume `SWITCH_START` (`*{`)
2. Parse restricted tokens until `SWITCH_DELIM` (`}{`) → `left` AST
3. Parse restricted tokens until `SWITCH_DELIM` (`}{`) → `right` AST
4. Read TEXT token → `key`
5. Consume `CLOSE` (`}`)
6. Parse remaining tokens → `sibling` AST
7. Return `new Switch({ left, right, key, sibling })`

### Relative Key Resolution (`_getRelativeKey`)

Copy references support relative paths using `.` prefixes (like file paths):

- `${.sibling}` — same parent level
- `${..uncle}` — one level up

Resolution: count leading dots, remove that many segments from the current key path, append the remainder. — `js/copy-service/Parser/Parser.ts#L372-L396`

### Error Handling

Parse errors call `ErrorHandler.handleError` with `halt: true`, which throws. The `_parse` wrapper catches errors and re-throws with context (original string).

## Gotchas

1. **Argument parsing is eager.** Once `}[` is found, the parser enters argument mode and expects `VERBATIM , ...` or `VERBATIM ]`. Arguments are always strings (not ASTs) — they cannot contain DSL syntax.

2. **HTML tag validation happens during tokenization**, not parsing. An invalid tag like `<q>` will throw during `_tokenize()`, before parsing begins.

3. **The `\b` token is NOT a regex word boundary.** It's a custom DSL token for word-break hints (`<wbr/>` in HTML). The parser handles it the same way as `\n`.

## Evidence

- `js/copy-service/Parser/Parser.ts#L1-L609` — Full implementation
- `js/copy-service/Parser/Parser.ts#L38-L55` — Token definitions
- `js/copy-service/Parser/Parser.ts#L140-L213` — Tokenizer
- `js/copy-service/Parser/Parser.ts#L282-L609` — Recursive descent parser
- `js/copy-service/Parser/Parser.ts#L372-L396` — Relative key resolution
- `js/copy-service/Parser/Parser.test.ts` — 599 LOC of unit tests
