# Runtime Flow: Copy Evaluation (Register → Parse → Evaluate)

## Trigger

- **Type:** API call from application code
- **Location:** `evaluator.getCopy(key, substitutions)` — `js/copy-service/Evaluator/Evaluator.ts#L68-L76`

## Narrative

This is the primary flow — how copy goes from JSON registration to rendered output.

1. **Application registers copy** by calling `copyService.registerCopy(jsonCopy)`. The JSON is deep-cloned and merged into `_registeredCopy` — `js/copy-service/CopyService.ts#L60-L72`
2. **Application creates an evaluator** (e.g., `new PlainTextEvaluator(copyService)`) — `js/copy-service/Evaluator/Evaluator.ts#L38-L45`
3. **Application calls** `evaluator.getCopy('some.key', { value: 42 })` — `js/copy-service/Evaluator/Evaluator.ts#L68`
4. `getCopy()` wraps raw substitutions in a `Substitutions` instance (enables lazy evaluation) — `js/copy-service/Evaluator/Evaluator.ts#L72`
5. `getCopy()` calls `copyService.getAstForKey('some.key')` — `js/copy-service/Evaluator/Evaluator.ts#L73`
6. **Lazy parse (first access only):** If the value at this key is still a string, `getAstForKey()` calls `Parser.parseSingle(key, rawString)` to tokenize and parse the DSL string into an AST. The AST replaces the string in `_registeredCopy` — `js/copy-service/CopyService.ts#L112-L119`
7. The AST is returned to the evaluator — `js/copy-service/CopyService.ts#L131`
8. `getCopy()` calls `this.evalAST(this.getInitialResult(), ast, substitutions)` — `js/copy-service/Evaluator/Evaluator.ts#L75`
9. **Evaluation walks the AST:** For each node, the evaluator checks the cache, evaluates the node (dispatching on `instanceof` type), recurses on `ast.sibling`, caches the result if cacheable, and returns the accumulated output — `js/plain-text-evaluator/PlainTextEvaluator.ts#L30-L118`
10. **Substitution nodes** read values from the `Substitutions` instance — `js/copy-service/Substitutions/Substitutions.ts#L44-L51`
11. **Reference nodes** call `copyService.getAstForKey(refKey)` recursively, which may trigger another lazy parse — `js/plain-text-evaluator/PlainTextEvaluator.ts#L56-L59`
12. The final accumulated result is returned to the caller

## Sequence Diagram

```d2
shape: sequence_diagram

app: Application
eval: Evaluator
cs: CopyService
parser: Parser
subs: Substitutions

app -> cs: "registerCopy(json)"
app -> eval: "getCopy(key, rawSubs)"
eval -> subs: "new Substitutions(rawSubs)"
eval -> cs: "getAstForKey(key)"
cs -> parser: "parseSingle(key, string)" {
  style.stroke-dash: 3
  style.stroke: "#999"
}
parser -> cs: "AST" {style.stroke-dash: 3}
cs -> eval: "AST" {style.stroke-dash: 3}
eval -> eval: "evalAST(initial, ast, subs)"
eval -> subs: "get(key) / getBoolean(key)"
subs -> eval: "value" {style.stroke-dash: 3}
eval -> app: "formatted output" {style.stroke-dash: 3}
```

*Note: The dashed Parser call occurs only on first access (lazy parse). Subsequent calls return the cached AST directly.*

## Data Lineage

```d2
direction: right

Input: {
  json: "JSON Copy File"
  subs: "Substitutions Object"
}

Transform: {
  registration: "registerCopy()\nmerge + clone"
  tokenizer: "Tokenizer"
  parser: "Parser"
  evaluator: "evalAST()\nnode dispatch"
}

Storage: {
  store: "registeredCopy store" {shape: cylinder}
}

Output: {
  text: "Plain Text / HTML / JSX"
}

Input.json -> Transform.registration
Transform.registration -> Storage.store
Storage.store -> Transform.tokenizer: "raw string (first access)"
Transform.tokenizer -> Transform.parser: "Token[]"
Transform.parser -> Storage.store: "AST replaces string"
Storage.store -> Transform.evaluator: "AST"
Input.subs -> Transform.evaluator
Transform.evaluator -> Output.text
```

## Key Data Elements

- **Input:** JSON copy files (`CopyFile`), substitution objects
- **Intermediate:** Token arrays (transient, not stored), AST trees (cached in `_registeredCopy`)
- **Output:** `string` (PlainText/HTML) or `React.ReactNode` (React)

## Performance Characteristics

1. **Registration:** O(n) deep clone + merge where n = number of copy keys
2. **First parse:** O(m) where m = copy string length (tokenize + parse)
3. **Subsequent access:** O(1) — cached AST returned directly
4. **Evaluation:** O(k) where k = number of AST nodes, but cached subtrees skip with O(1) lookup
5. **Substitution functions:** Called at most once per Substitutions instance (lazy evaluation caching)

## Evidence

- `js/copy-service/Evaluator/Evaluator.ts#L68-L76` — `getCopy()` entry point
- `js/copy-service/CopyService.ts#L107-L131` — `getAstForKey()` lazy parsing
- `js/copy-service/Parser/Parser.ts#L135-L168` — `parseSingle()`
- `js/plain-text-evaluator/PlainTextEvaluator.ts#L30-L118` — `evalAST()` node dispatch
- `js/copy-service/Substitutions/Substitutions.ts#L27-L33` — Lazy substitution evaluation
