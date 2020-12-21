# Copy Service

[![A UX Framework Project](https://img.shields.io/badge/NC-UX%20Framework-%2300a5f6?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAA/FBMVEUApfYAAAAApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYApfYk6uC4AAAAU3RSTlMAAJHwVI7ULQcDHcG4FyyxdAE13JQInQLv+G4Kl9AoePvqRynk6UYLnNNrZxrCsxLDsBPPK3Np5UAu51X0YpnSKjbd/oQFGboepg+0cZPEIATmP31l8v0AAAC1SURBVBgZBcGHIsMAFEDReykVWgRtanYYCVp71ay95/v/f3EOMDRcAlVVgZEYLYPCWILA+ERUqgiTU9MpCDOzMVeDaiXqGSiUGvMLLC7F8gqgkjVb7c7q2voGiCp5EZvlre0URRW6vdjZTVBRhe5e7B8kqKiSF3F4dHySoqgkzdbpWf+83QFRuGhcXpFfx80AEG7v7h8e4ek5igzgpRevbwj99w+A7DO+vkGh9oOQ1X//QFXVf8KAFHYrlyAPAAAAAElFTkSuQmCC)](https://github.com/BLC/ux-framework/wiki)

[![Node Version](https://img.shields.io/badge/node-%3E%3D%2012.13.1-brightgreen)](https://nodejs.org/)

A JavaScript service for copy management. This service allows providing copy in our custom DSL, then evaluating it to an output format (eg: text, HTML, React JSX) with dynamic substitutions at runtime.

What is "copy"? Basically, any human-readable text visible in your application UI. This service helps centralize copy handling in your application, making it easier to manage. No more hardcoded strings in templates or janky regex substitutions!

## Features

- Supports registration of copy from multiple sources, merging later copy into already registered copy.
  - Allows for concise tenant and application overrides of abstracted, generic copy.
- Provides a verbose syntax for dynamic feature support
  - Reference syntax to other copy, preventing duplication
  - Substitution syntax to interpolate dynamic values, including dynamic references to other copy
  - Functional syntax to handle complex formatting and logic-based substitutions
  - Supports formatting HTML tags (e.g. `<strong>`, `<em>`)
    - NOTE: Support for `<b>` and `<i>` has been dropped to meet accessibility standards
  - Support for links and other custom formatting
- Supports different output formats via Evaluators
  - String literals, React components, etc...
  - Need something else? Build your own evaluator!
- Works natively on node, and works without babel in webpack/browsers.
  - Greater for server or client side rendering!
- Full support for internationalization (i18n)
  - Switch languages dynamically at runtime
  - Language hierarchy with automatic fallbacks
- High performance:
  - Copy isn't parsed until it is used. Once it is parsed, the AST is cached.
  - Whenever an evaluator sees that an AST will always produce the same result, it will
    cache it, preventing the need for evaluation on subsequent requests.
  - In fact, if the evaluation for even part of an AST can be cached, it will be.
  - A single shared copy service can be used with many evaluators
  - Overall, the system is designed to minimize array and object allocations.

## Structure

The Copy Service project is made up of two primary parts: the `CopyService` class and the `Evaluator` subclasses. The `CopyService` class handles registration of copy and parsing copy into an AST that any `Evaluator` subclass can consume. Evaluator subclasses are responsible for processing requests for copy, converting the AST into formatted copy with interpolated substitutions.

### Evaluators

Currently, this project provides three evaluators:

- `HtmlEvaluator` returns copy formatted as a string of HTML elements.
- `PlainTextEvaluator` returns copy formatted as string literals.
- `ReactEvaluator` returns copy formatted as React components (JSX).

Need something else? Feel free to build a custom `Evaluator` subclass!

## Installation

```
npm install --save @nextcapital/copy-service
```

## Usage

```javascript
import { CopyService } from '@nextcapital/copy-service';
import HtmlEvaluator from '@nextcapital/copy-service/HtmlEvaluator';
import PlainTextEvaluator from '@nextcapital/copy-service/PlainTextEvaluator';
import ReactEvaluator from '@nextcapital/copy-service/ReactEvaluator';

import copy from './some/path/to/copy.json';

const copyService = new CopyService();
copyService.registerCopy(copy);

const htmlEvaluator = new HtmlTextEvaluator(copyService);
const textEvaluator = new PlainTextEvaluator(copyService);
const reactEvaluator = new ReactEvaluator(copyService);

const htmlCopy = htmlEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
const stringCopy = textEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
const jsxCopy = reactEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
```

### Copy Keys

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

- The copy key for `'Account Number'` is `account.accountNumber`.
- The copy key for `'Checking'` is `account.characters.checking`.

### Substitutions

The copy service allows for dynamic interpolation of values in copy. These substitutions can be provided with the request for a piece of copy and will be interpolated in the final formatted copy. The syntax (defined below) will reference keys on the passed substitutions object to find the correct value to interpolate.

**Note**: Most substitutions do not require calculations and can be directly provided on the substitutions object. However, some values require expensive calculations (i.e. take a long time to calculate). For this, there are two solutions. First, instead of passing a substitution object, a function returning a substitution object can be passed. The function will not be invoked until a piece of copy requiring a substitution is requested. The substitution object returned by this function will be cached and reused for subsequent substitutions. This allows multiple parts of a copy key to use the same cached value without double-calculating it. Second, a function can be passed as an individual substitution using the syntax defined below, which will not be called until the piece of copy is requested.

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

### Writing Copy

#### Syntax

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

Valid HTML tags are  `<strong>`, `<u>`, `<sup>`, `<sub>`, `<s>`, `<em>`, `<p>`, `<span>`, `<div>`, `<ol>`, `<ul>`, `<li>`. Instead of `b` and `i` tags, use `strong` and `em` in order to improve accessibility.

#### Examples

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
    "save": "<strong>Save</strong>",
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
- With the `HtmlEvaluator`, `account.save` will resolve to `'<span><strong>Save</strong></span>'`.
- With the `PlainTextEvaluator`, `account.save` will resolve to `'Save'`.
- With the `ReactEvaluator`, `account.save` will resolve to `<span><strong>Save</strong></span>`.
- With the `HtmlEvaluator`, `account.cancel` will resolve to `'<span>Cancel</span>'`.
- With the `PlainTextEvaluator`, `account.cancel` will resolve to `'Cancel'`.
- With the `ReactEvaluator`, `account.cancel` will resolve to `<span>Cancel</span>`.
- With the `HtmlEvaluator`, `account.rollover` will resolve to `'<span>You may rollover your external IRA</span>'`.
- With the `PlainTextEvaluator`, `account.rollover` with substitutions `{ rollover: (copy) => copy + 'your external IRA' }` will resolve to `'You may rollover'`.
- With the `ReactEvaluator`, `account.rollover` will resolve to `<span>You may rollover your external IRA</span>`.
- With the `HtmlEvaluator`, `account.implement` with substitutions `{ implement: (copy, addMore) => copy + 'your NextCapital managed account' }` will resolve to `'<span>You are going to implement your NextCapital managed account</span>'`.
- With the `PlainTextEvaluator`, `account.implement` with substitutions `{ implement: (copy, addMore) => copy + 'your NextCapital managed account' }` will resolve to `'You are going to implement'`.
- With the `ReactEvaluator`, `account.implement` with substitutions `{ implement: (copy, addMore) => copy + 'your NextCapital managed account' }` will resolve to `<span>You are going to implement your NextCapital managed account</span>`.

## Internationalization (i18n)

We reccomend two strategies for internationalization, each with their benefits and drawbacks:

- static:
  - The server knows the correct languages, and returns a copy file for that language that has the fallback hierarchy already applied to it locally.
  - A plain `CopyService` would register this copy and be used as normal.
  - This has the best performance, as copy for other languages never needs to be downloaded/included. However, you cannot switch languages at runtime.
- dynamic:
  - Use `IntlCopyService` instead of `CopyService`, provide the hierarchy and all language copy.
  - This allows switching languages dynamically at runtime.
  - However, it requires more bandwidth, as copy for other languages that the end user may never need is included.
  - This is the best solution when running natively on node.

In either case, the copy service should support all use cases for internationalization. Whenever passing in substitutions that may need i18n support (eg: formatted dates), make sure those substitutions are also properly localized.

## Contributing to Copy Service

### Maintainers
[Jonathan Pierce (@nc-piercej)](https://github.com/nc-piercej)
[Mike Kreiser (@nc-kreiserm)](https://github.com/nc-kreiserm)

### Background

This project uses a parser-evaluator pattern on ASTs built on a defined grammar. The copy-service package is the parser responsible for tokenizing each piece of copy and parsing it into an AST of ES6 classes representing syntax. The evaluator is responsible for evaluating the AST generated for a given Copy Key into copy formatted as a string literal, HTML, JSX (React component), etc.

### Grammar

The grammar is not left-recursive and therefore recursive-descent (easily) parsable.

Writing an LR parser would be significantly more difficult, so best to avoid complex grammars.

```
COPY :: *{ RESTRAINED RESTRAINED VERBATIM } COPY | ${ VERBATIM } COPY | #{ VERBATIM } COPY | VERBATIM COPY | ^{ RESTRAINED VERBATIM } COPY | ^{ RESTRAINED VERBATIM }[ ARGUMENTS | COPY nil

RESTRAINED :: *{ RESTRAINED RESTRAINED VERBATIM } RESTRAINED | ${ VERBATIM } RESTRAINED | #{ VERBATIM } RESTRAINED | ^{ RESTRAINED VERBATIM } RESTRAINED | VERBATIM RESTRAINED | | ^{ RESTRAINED VERBATIM }[ ARGUMENTS | }{ ARGUMENTS: VERBATIM ] | VERBATIM , ARGUMENTS

VERBATIM :: any string that does not begin with *{, #{, ^{, or ${
```

**NOTE: Many bothans died to bring you this grammar.**
