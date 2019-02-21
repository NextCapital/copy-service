# Consuming copy-service

## Installation

These packages live on Nextcapital's internal npm registry. Run the following configuration if you have not on your npm instance already:

```
npm set registry https://npm.nextcapital.com
npm adduser --registry https://npm.nextcapital.com
```

Then:

```
npm install --save @nextcapital/copy-service
```

## Copy Keys

Copy Keys (sometimes denoted without the space: CopyKeys) are the key path in a copy object to a piece of copy. This path can be easily retrieved using lodash's `get` method.

Example (`copy.json`):

```json
{
    "account": {
        "accountNumber": {
            "primary": "Account Number"
        },
        "characters": {
            "checking": "Checking",
            "savings": "Savings"
        }
    }
}
```

The copy key for `'Account Number'` is `account.accountNumber`.

The copy key for `'Checking'` is `account.characters.checking`.

## Substitutions

When calling `getCopy`, you can optionally pass an object as the second argument for substitutions from the consuming project. The object can have nested properties. Any `substitutitonKey` referenced below uses the same key path syntax as Copy Keys.

Example (a substitution object passed to `getCopy`):

```json
{
    "value": 4000,
    "nested": {
        "displayValue": "4,000.00"
    }
}
```

The valid `substitutionKey` paths for these attributes are `value` and `nested.displayValue`.

NOTE: If your substitutions are computationally expensive, you can pass in a function that returns them. The function won't be called unless one is actually needed, and it will only be called once if there are multiple substitutions used within a single copy key.

See the generated documentation for more detail on method signatures.

## Writing a copy file

Copy files must be valid JSON.

### Syntax

#### Reference to another piece of copy

Syntax: `${key.to.other.copy}`

Allows one piece of copy to directly substitute another piece of copy. Works recursively.

Example:

```json
{
    "account": {
        "name": "Account",
        "description": "${account.characters.checking}",
        "characters": {
            "checking": "Checking Account",
            "savings": "Savings Account"
        },
        "recursiveProof": "${account.description}"
    }
}
```

`account.description` will resolve to `'Checking Account'`.

`account.recursiveProof` will also resolve to `'Checking Account'`.

#### Direct substitution

Syntax: `#{substitutionKey}`

Allows direct substitutions into copy from consuming projects. The substitution key must reference a valid path on the passed substitutions object, otherwise an error is thrown.

Example:

```json
{
    "account": {
        "name": "Account",
        "value": "$#{accountValue}"
    }
}
```

`account.value` with the substitution object `{ accountValue: 100 }` will resolve to `'$100'`.

#### Simple switching

Syntax: `*{left}{right}{substitutionKey}`

Allows conditional logic within copy. When the passed substitution returns `true` or `1`, the `left` copy is resolved. Otherwise, the `right` copy is resolved. The substitution key must reference a valid path on the passed substitutions object, otherwise an error is thrown. Works recursively.

Example:

```json
{
    "account": {
        "name": "Account",
        "linked": "*{Linked}{Not Linked}{isLinked}"
    }
}
```

`account.linked` with the substitution object `{ isLinked: false }` will resolve to `'Not Linked'`.

#### Functional substitution

Syntax: `^{copy}{substitutionKey}`

**NOTE: The function provided on the substitution object is only invoked when using the ReactEvaluator. When using the PlainTextEvaluator, the function is not invoked and the initial `copy` is returned.**

Passes copy to a function whose result is returned. Extrememly powerful. Useful for inserting links, additional formatting, etc.

Example:

```json
{
    "account": {
        "name": "Account",
        "formattedName": "^{Format me}{subFunc}"
    }
}
```

`account.formattedName` with the substitution object `{ subFunc: (copy) => 'I did' + copy }` will resolve to `'I did Format me'`.

#### Functional substitution with arguments

Syntax: `^{copy}{substitutionKey}[arg1, arg2...]`

**NOTE: The function provided on the substitution object is only invoked when using the ReactEvaluator. When using the PlainTextEvaluator, the function is not invoked and the initial `copy` is returned.**

**NOTE: Arguments are passed as string literals. `true` would be passed as `'true'`.**

Passes copy to a function with optional arguments whose result is returned. Extrememly powerful.

Example:

```json
{
    "account": {
        "name": "Account",
        "formattedName": "^{Format me}{subFunc}[more]"
    }
}
```

`account.formattedName` with the substitution object `{ subFunc: (copy, more) => 'I did ' + copy + + ' ' + more }` will resolve to `'I did Format me more'`.

#### HTML formatting

Syntax: `<tag>copy</tag>`

**NOTE: HTML tags are only included when using ReactEvaluator. When using the PlainTextEvaluator, the tags are omitted and the initial `copy` is returned.**

Allows for basic HTML tags for visual formatting.

Valid tags: `<b>`, `<i>`, `<u>`, `<sup>`, `<sub>`, `<s>`, `<em>`, `<p>`, `<span>`, `<div>`, `<ol>`, `<ul>`, `<li>`

Example:

```json
{
    "account": {
        "name": "Account",
        "formattedName": "<b>I will be bold</b>",
        "illegalTag": "<q>I will not have tags</q>"
    }
}
```

`account.formattedName` will resolve to `<b>I will be bold</b>`.

`account.illegalTag` will resolve to `I will not have tags`.

## Registering copy

```javascript
import CopyService from '@nextcapital/copy-service';
import PlainTextEvaluator from '@nextcapital/copy-service/js/PlainTextEvaluator';
import ReactEvaluator from '@nextcapital/copy-service/js/ReactEvaluator';

import copy from './copy.json';

const copyService = new CopyService();
copyService.registerCopy(copy);

// one copy service can be used by multiple evaluators
const reactEvaluator = new ReactEvaluator(copyService);
const textEvaluator = new PlainTextEvaluator(copyService);
```

## Getting copy

```javascript
// Assumes reactEvaluator as set up above
const copy = reactEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
```
