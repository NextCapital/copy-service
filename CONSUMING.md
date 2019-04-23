# Using Copy Service

## Copy Keys

Copy keys are a key path in a registered copy file to a specific piece of copy.

#### Example

```json
// copy.json
{
    "account": {
        "accountNumber": "Account Number",
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

The copy service allows for dynamic interpolation of values in copy. These substitutions can be provided with the request for a piece of copy and will be interpolated in the final formatted copy. The syntax (defined below) will reference keys on the passed substitutions object to find the correct value to interpolate. 

**Note**: Most substitutions do not require calculations and can be directly provided on the substitutions object. However, some values require expensive calculations (i.e. take a long time to calculate). For this, there are two solutions. First, instead of passing a substitution object, a function returning a substitution object can be passed. The function will not be invoked until a piece of copy requiring a substitution is requested. The substitution object returned by this function will be cached and reused for subsequent substitutions. This allows multiple parts of a copy key to use the same cached value. Second, a function can be passed as an individual substitution using the syntax defined below, which will not be called until the piece of copy is requested.

#### Example

```json
{
    "value": 4000,
    "nested": {
        "displayValue": "4,000.00"
    }
}
```

The valid `substitutionKey` paths for these attributes are `value` and `nested.displayValue`.

## Writing a Copy File

**Note:** All copy files must be valid JSON files.

### Syntax

| Syntax                                       | Description                                                  |
| -------------------------------------------- | ------------------------------------------------------------ |
| `${some.copy.key.to.reference}`              | Interpolates another piece of copy. Works recursively.       |
| `#{substitutionKey}`                         | Interpolates a substitution.                                 |
| `%{substitutionKey}`                         | Grabs a copy key reference from the substitutions and interpolates the referenced copy. |
| `*{left}{right}{substitutionKey}`            | Interpolates left or right copy based on the value of the substitution (i.e. basic logic switch). If the substitution evaluates to a truthy value or the number 1, the left copy will be interpolated. If  the substitution evaluates to a falsy value or the number 0, the right copy will be interpolated. |
| `^{COPY}{substitutionKey}`*                  | Passes COPY to a function that returns copy. Allows for extremely flexible interpolation and evaluation of copy. Useful for inserting links. |
| `^{COPY}{substitutionKey}[arg1, arg2, ...]`* | Passes COPY and arguments to a function that returns copy. Arguments are passed as string literals (e.g. the boolean `true` will be passed as the string `'true'`). |
| `<html>COPY</html>`*^                        | Interpolates HTML formatting tags. Valid tags are listed below. Invalid tags will be ignored. |

\* This syntax is not executed when using the PlainTextEvaluator. The PlainTextEvaluator will simply return the `COPY` inside of the syntax tags.

^ Valid HTML tags are  `<b>`, `<i>`, `<u>`, `<sup>`, `<sub>`, `<s>`, `<em>`, `<p>`, `<span>`, `<div>`, `<ol>`, `<ul>`, `<li>`.

### Examples

```json
// copy.json
{
  "account": {
		"name": "Account",
    "value": "#{accountValue}",
    "description": "${account.characters.checking}",
    "characters": {
      "checking": "Checking Account",
      "savings": "Savings Account"
    },
    "owner": "*{Spouse}{Primary}{isSpouse}",
    "recursiveProof": "${account.description}",
    "subbedCharacter": "%{character}",
    "switchedCharacter": "*{${account.characters.checking}}{${account.characters.savings}}{characterSwitch}",
    "save": "<b>Save</b>",
    "cancel": "<q>Cancel</q>",
    "rollover": "^{You may rollover}[rollover]",
		"implement": "^{You are going to implement}[implement][true]"
  }
}
```

- `account.name` will resolve to `'Account'`.

- `account.description` will resolve to `'Checking Account'`.

- `account.recursiveProof` will resolve to `'Checking Account'`.

- `account.value` with substitutions `{ accountValue: 100 }` will resolve to `'$100'`.

- `account.subbedCharacter` with substitutions `{ character: 'account.characters.savings' }` will resolve to `'Savings Account'`.

- `account.owner` with substitutions `{ isSpouse: true }` will resolve to `'Spouse'`.

- `account.owner` with substitutions `{ isSpouse: false }` will resolve to `'Primary'`.

- `account.switchedCharacter` with substitutions `{ characterSwitch: true }` will resolve to `'Checking Account'`.

  

- With the PlainTextEvaluator, `account.save` will resolve to `'Save'`.

- With the ReactEvaluator, `account.save` will resolve to `<span><b>Save</b></span>`.

- With the PlainTextEvaluator, `account.cancel` will resolve to `'Cancel'`.

- With the ReactEvaluator, `account.cancel` will resolve to `<span>Cancel</span>`.

  

- With the PlainTextEvaluator, `account.rollover` with substitutions `{ rollover: (copy) => copy + 'your external IRA' }` will resolve to `'You may rollover'`.

- With the ReactEvaluator, `account.rollover` will resolve to `<span>You may rollover your external IRA</span>`.

  

- With the PlainTextEvaluator, `account.implement` with substitutions `{ implement: (copy, addMore) => copy + 'your NextCapital managed account' }` will resolve to `'You are going to implement'`.

- With the ReactEvaluator, `account.implement` with substitutions `{ implement: (copy, addMore) => copy + 'your NextCapital managed account' }` will resolve to `<span>You are going to implement your NextCapital managed account</span>`.

