# Glossary

> Quick reference for Copy Service terminology. Terms are listed alphabetically. This glossary focuses on **copy-service-specific terms and context**.

### AST

Abstract Syntax Tree — the parsed representation of a DSL string. A linked list of `SyntaxNode` subclass instances. `null` represents empty copy. TypeScript type: `SyntaxNode | null`. Used in Parser, CopyService, and all Evaluators.

### Cacheable

An AST node whose evaluation result is deterministic (no substitution dependencies). Cacheable nodes' results are stored in a WeakMap to avoid re-evaluation. See `SyntaxNode.isCacheable()` and `Evaluator.evaluationCache`.

### Copy

Human-readable text displayed in the UI. A single "piece of copy" is one string value in a copy JSON file. Not "copying data" — refers specifically to user-facing text.

### Copy File

A JSON file containing copy organized as a nested object. Leaf values are DSL strings; intermediate values are objects for grouping. Registered via `CopyService.registerCopy()`. TypeScript type: `CopyFile`.

### Copy Key

A dot-delimited path to a leaf value in a copy JSON file (e.g., `account.name`). Only paths to string leaves are valid copy keys — paths to intermediate objects are not. Similar to i18next "translation key". Used in `CopyService` and evaluators.

### Copy Merging

The process of combining multiple copy registrations. String and AST values replace; objects merge recursively. Enables tenant overrides. See `CopyService._mergeParsedCopy()`.

### Decider

The substitution value used by a Switch node to choose between left and right branches. Evaluated via `getBoolean()`. See `Switch` node and `Substitutions.getBoolean()`.

### DSL

The Copy Service Domain-Specific Language — syntax for references (`${}`), substitutions (`#{}`), switches (`*{}{}{}`), functionals (`^{}{}`), and formatting (`<tag>`) within copy strings. See [dsl-reference.md](dsl-reference.md).

### Evaluator

A class that walks an AST and produces formatted output. Different evaluators produce different output types (string, HTML, React JSX). See `Evaluator`, `PlainTextEvaluator`, `HtmlEvaluator`, `ReactEvaluator`.

### Formatting

A DSL syntax (`<tag>copy</tag>`) for HTML formatting. Evaluated differently by each evaluator: stripped in PlainText, preserved in HTML, converted to React elements in React. Represented by the `Formatting` node.

### Functional

A DSL syntax (`^{copy}{fn}`) that passes evaluated copy through a user-provided function. Enables arbitrary transformations (links, custom formatting). Represented by the `Functional` node.

### Language Hierarchy

A mapping of languages to parent languages, defining fallback order for missing copy. Root languages have `null` as their parent. Used in `IntlCopyService`.

### Reference

A DSL syntax (`${}`) that includes copy from another key. Resolved at evaluation time. Supports relative paths. Not "JavaScript reference" — refers to copy-key cross-referencing. Represented by the `Reference` node.

### Registered Copy

Copy that has been added to the CopyService via `registerCopy()`. May be unparsed strings or parsed ASTs, depending on whether the key has been accessed. Stored in `CopyService._registeredCopy`.

### RefSubstitute

A DSL syntax (`%{}`) that reads a copy key name from substitutions, then evaluates that key. Two-level indirection. Represented by the `RefSubstitute` node.

### Relative Reference

A reference using `.` prefixes to resolve keys relative to the current key's position (e.g., `${.sibling}`, `${..uncle}`). See Parser `_getRelativeKey()`.

### Root Language

A language with no parent (`null` in the hierarchy). Missing copy in a root language produces an error — there is no further fallback. See `IntlCopyService._getHierarchy()`.

### Sibling

The next node in the AST linked list at the same depth level. Each `SyntaxNode` has a `sibling` property pointing to the next node. Not "sibling" in the DOM sense — refers to horizontal AST linkage.

### Substitution Key

A dot-delimited path on the substitutions object (e.g., `user.profile.name`). Uses `#{key}` syntax in copy. See `Substitute` node and `Substitutions.get()`.

### Substitutions

Runtime values provided by the caller when evaluating copy. Can be an object or a function returning an object. Values are accessed by key path (e.g., `user.name`). Not "string substitution" — refers to the runtime value resolution system.

### Switch

A DSL syntax (`*{left}{right}{key}`) that chooses between two branches based on a substitution value. The "decider" uses boolean evaluation with special number handling. Not a JavaScript `switch` statement. Represented by the `Switch` node.

### Tenant Override

A copy file containing locale- or client-specific copy that overrides keys from the base copy file. Registered after base copy via `registerCopy()`.

### Verbatim

An AST node representing literal text — no interpolation or transformation needed. Represented by the `Verbatim` node.

### Word Break

A `\b` character in copy that produces a `<wbr/>` tag in HTML/React or nothing in plain text. Hints to the browser where long words can be broken. NOT a regex word boundary. Represented by the `WordBreak` node.
