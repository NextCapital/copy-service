# Glossary of Proprietary Terms

Terms unique to the Copy Service codebase. Standard TypeScript/React terms are not included.

| Term | Definition | Where Used | Ambiguity Notes |
|------|-----------|------------|----------------|
| **Copy** | Human-readable text displayed in the UI. A single "piece of copy" is one string value in a copy JSON file. | Everywhere | Not "copying data" — refers specifically to user-facing text |
| **Copy Key** | A dot-delimited path to a leaf value in a copy JSON file (e.g., `account.name`). Only paths to string leaves are valid copy keys — paths to intermediate objects are not. | `CopyService`, evaluators | Similar to i18next "translation key" |
| **Copy File** | A JSON file containing copy organized as a nested object. Leaf values are DSL strings; intermediate values are objects for grouping. | `CopyService.registerCopy()` | TypeScript type: `CopyFile` |
| **DSL** | The Copy Service Domain-Specific Language — syntax for references (`${}`), substitutions (`#{}`), switches (`*{}{}{}`), functionals (`^{}{}`), and formatting (`<tag>`) within copy strings. | Parser, all docs | See [dsl-reference.md](dsl-reference.md) |
| **AST** | Abstract Syntax Tree — the parsed representation of a DSL string. A linked list of `SyntaxNode` subclass instances. `null` represents empty copy. | Parser, CopyService, Evaluators | TypeScript type: `SyntaxNode \| null` |
| **Sibling** | The next node in the AST linked list at the same depth level. Each `SyntaxNode` has a `sibling` property pointing to the next node. | All SyntaxNode subclasses | Not "sibling" in the DOM sense — refers to horizontal AST linkage |
| **Evaluator** | A class that walks an AST and produces formatted output. Different evaluators produce different output types (string, HTML, React JSX). | `Evaluator`, `PlainTextEvaluator`, `HtmlEvaluator`, `ReactEvaluator` | |
| **Substitutions** | Runtime values provided by the caller when evaluating copy. Can be an object or a function returning an object. Values are accessed by key path (e.g., `user.name`). | `Substitutions` class, evaluators | Not "string substitution" — refers to the runtime value resolution system |
| **Substitution Key** | A dot-delimited path on the substitutions object (e.g., `user.profile.name`). Uses `#{key}` syntax in copy. | `Substitute` node, `Substitutions.get()` | |
| **Reference** | A DSL syntax (`${}`) that includes copy from another key. Resolved at evaluation time. Supports relative paths. | `Reference` node, Parser | Not "JavaScript reference" — refers to copy-key cross-referencing |
| **Relative Reference** | A reference using `.` prefixes to resolve keys relative to the current key's position (e.g., `${.sibling}`, `${..uncle}`). | Parser `_getRelativeKey()` | |
| **RefSubstitute** | A DSL syntax (`%{}`) that reads a copy key name from substitutions, then evaluates that key. Two-level indirection. | `RefSubstitute` node | |
| **Switch** | A DSL syntax (`*{left}{right}{key}`) that chooses between two branches based on a substitution value. The "decider" uses boolean evaluation with special number handling. | `Switch` node | Not a JavaScript `switch` statement |
| **Functional** | A DSL syntax (`^{copy}{fn}`) that passes evaluated copy through a user-provided function. Enables arbitrary transformations (links, custom formatting). | `Functional` node | |
| **Formatting** | A DSL syntax (`<tag>copy</tag>`) for HTML formatting. Evaluated differently by each evaluator: stripped in PlainText, preserved in HTML, converted to React elements in React. | `Formatting` node | |
| **Verbatim** | An AST node representing literal text — no interpolation or transformation needed. | `Verbatim` node | |
| **Decider** | The substitution value used by a Switch node to choose between left and right branches. Evaluated via `getBoolean()`. | `Switch` node, `Substitutions.getBoolean()` | |
| **Cacheable** | An AST node whose evaluation result is deterministic (no substitution dependencies). Cacheable nodes' results are stored in a WeakMap to avoid re-evaluation. | `SyntaxNode.isCacheable()`, `Evaluator.evaluationCache` | |
| **Language Hierarchy** | A mapping of languages to parent languages, defining fallback order for missing copy. Root languages have `null` as their parent. | `IntlCopyService` | |
| **Root Language** | A language with no parent (`null` in the hierarchy). Missing copy in a root language produces an error — there is no further fallback. | `IntlCopyService._getHierarchy()` | |
| **Registered Copy** | Copy that has been added to the CopyService via `registerCopy()`. May be unparsed strings or parsed ASTs, depending on whether the key has been accessed. | `CopyService._registeredCopy` | |
| **Copy Merging** | The process of combining multiple copy registrations. String and AST values replace; objects merge recursively. Enables tenant overrides. | `CopyService._mergeParsedCopy()` | |
| **Tenant Override** | A copy file containing locale- or customer-specific copy that overrides keys from the base copy file. Registered after base copy via `registerCopy()`. | `CopyService.registerCopy()` | |
| **Word Break** | A `\b` character in copy that produces a `<wbr/>` tag in HTML/React or nothing in plain text. Hints to the browser where long words can be broken. | `WordBreak` node | NOT a regex word boundary |
| **allowFunctional** | An evaluator option that controls whether `^{}{}` syntax calls the substitution function. When `false`, the inner copy is returned without function execution. | `Evaluator` constructor | |
| **errorOnMissingRefs** | A CopyService option that makes missing copy keys throw errors instead of returning null. Useful for development and testing. | `CopyService` constructor | |

## Evidence

- All terms are derived from class names, property names, and code comments in the source files listed in [README.md](README.md) Component Inventory.
