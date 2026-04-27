# Runtime Flow: Caching (Lazy Parsing + Evaluation Caching)

## Trigger

- **Type:** Performance optimization — triggered automatically during copy access and evaluation
- **Location:** Parsing cache in `CopyService._registeredCopy`, evaluation cache in `Evaluator.evaluationCache`

## Why Caching Exists

A page render may evaluate hundreds of copy keys, so Copy Service caches at two layers to avoid re-parsing and re-walking ASTs:

## Two-Layer Caching Strategy

### Layer 1: Parse Cache (in-place AST replacement)

**Location:** `CopyService._registeredCopy` — `js/copy-service/CopyService.ts#L112-L119`

When `getAstForKey(key)` is called:
- If the value at `key` is a **string** → parse it → replace the string with the AST in-place → return the AST
- If the value at `key` is an **AST** → return it directly (already parsed)

**This is destructive caching.** The original string is replaced and cannot be recovered from `_registeredCopy` (though `getRegisteredCopy()` can reconstruct it via `toSyntax()`).

**Lifetime:** Until the `CopyService` instance is garbage-collected or `registerCopy()` is called with new copy at the same key (which replaces the cached AST with a new string).

### Layer 2: Evaluation Cache (WeakMap)

**Location:** `Evaluator.evaluationCache: WeakMap<SyntaxNode, T>` — `js/copy-service/Evaluator/Evaluator.ts#L24`

After evaluating an AST node and its sibling chain:
- If `ast.isCacheable(copyService)` returns `true` → store the result in the WeakMap
- On subsequent evaluation, check the WeakMap first → if present, return cached result

**Why WeakMap?** When copy is re-registered and AST nodes are replaced, the old nodes are garbage-collected. WeakMap keys are weak references, so cached entries are garbage-collected automatically — no manual invalidation needed.

## Cacheability Rules

A node is cacheable if and only if it and its entire sibling chain contain NO substitution-dependent nodes. See [component-004-syntax-nodes.md](component-004-syntax-nodes.md) for the full cacheability table.

**Never cacheable:** `Substitute`, `RefSubstitute`, `Switch`, `Functional` — all depend on runtime substitutions.

**Conditionally cacheable:** `Verbatim`, `Reference`, `Formatting`, `Newline`, `WordBreak` — cacheable if their sibling (and any child ASTs) are also cacheable. `Reference` additionally requires the referenced AST to be cacheable.

**Important: The cached value includes the entire sibling chain.** When `setCacheIfCacheable(ast, evaluated)` is called, `evaluated` is the result of `evalAST(copy, ast.sibling, subs)` — it includes this node's output plus all following siblings.

## Sequence Diagram

```d2
shape: sequence_diagram

eval: Evaluator
cache: "WeakMap Cache"
cs: CopyService
parser: Parser

eval -> cs: "getAstForKey(key)"

cs -> cs: "check: string or AST?"
cs -> parser: "parseSingle() [first access only]"
parser -> cs: "AST" {style.stroke-dash: 3}
cs -> cs: "replace string with AST"
cs -> eval: "AST" {style.stroke-dash: 3}

eval -> cache: "getCached(ast)"
cache -> eval: "undefined (miss)" {style.stroke-dash: 3}
eval -> eval: "evalAST() walks tree"
eval -> cache: "setCacheIfCacheable(ast, result)"
eval -> eval: "return result"

eval -> cache: "getCached(ast) [next call]"
cache -> eval: "cached result (hit)" {style.stroke-dash: 3}
eval -> eval: "skip evaluation, return cached"
```

## Partial Cacheability Example

Consider: `Hello #{name}, welcome to ${site.name}`

```text
Verbatim("Hello ")
  └─ sibling → Substitute("name")         ← NOT cacheable
                  └─ sibling → Verbatim(", welcome to ")
                                  └─ sibling → Reference("site.name")  ← cacheable (if site.name is static)
```

- The `Reference("site.name")` + its resolution are cacheable (no substitutions) → cached after first eval
- `Substitute("name")` is never cacheable → re-evaluated every time
- `Verbatim("Hello ")` is NOT cacheable because its sibling chain includes `Substitute` → re-evaluated every time
- But `Verbatim(", welcome to ")` depends: if `Reference("site.name")` is cached, then the tail starting from ", welcome to " might benefit from the Reference cache hit

The evaluation of Reference's result is cached independently, so even though the full chain re-evaluates, the Reference node returns its cached result in O(1).

## Evidence

- `js/copy-service/CopyService.ts#L112-L119` — In-place AST replacement (parse cache)
- `js/copy-service/Evaluator/Evaluator.ts#L24` — WeakMap declaration
- `js/copy-service/Evaluator/Evaluator.ts#L49-L64` — `getCached()` and `setCacheIfCacheable()`
- `js/plain-text-evaluator/PlainTextEvaluator.ts#L36-L38` — Cache check in evalAST
- `js/plain-text-evaluator/PlainTextEvaluator.ts#L116-L117` — Cache storage after evaluation
- `js/copy-service/SyntaxNode/SyntaxNode.ts#L47-L55` — Base `isCacheable()` (returns `false`)
- `js/copy-service/Reference/Reference.ts#L39-L51` — Reference cacheability check
