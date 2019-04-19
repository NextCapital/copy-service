# Copy Service

A Javascript service for copy management. This service allows consumer to provide copy content (i.e. text). The service in turn handles formatting and substitutions into a piece of copy on a copy retrieval request from the consumer.

## Features

- Supports registration of copy from multiple sources, merging latter copy into already registered copy.
  - Allows for concise tenant and application overrides of abstracted, generic copy.
- Provides a verbose syntax for dynamic feature support
  - Reference syntax to other copy, preventing duplication
  - Substitution syntax to interpolate dynamic values, including dynamic references to other copy
  - Functional syntax to handle complex formatting and logic-based substitutions
  - Supports formatting HTML tags (e.g. `<b>`, `<i>`)
- Supports different output formats via Evaluators
  - String literals, React components

## Documentation

[System Documentation (Confluence)](<https://confluence.internal.nextcapital.com/display/SC/Copy+Service>)

[Developer System Documentation](./CONSUMING.md) - Contains docs on writing copy files and syntax

## Structure

There are separate two pieces: the CopyService class and Evaluator classes. The CopyService class handles registration of copy and parsing copy into a format that any Evaluator class can consume. Evaluator classes are responsible for processing requests for copy, converting the syntax into formatted copy with interpolated substitutions.

### Evaluators

PlainTextEvaluator returns copy formatted as string literals.

ReactEvaluator returns copy formatted as React components.

## Installation

```
npm install --save @nextcapital/copy-service
```

## Usage

```javascript
import CopyService from '@nextcapital/copy-service';
import PlainTextEvaluator from '@nextcapital/copy-service/PlainTextEvaluator';
import ReactEvaluator from '@nextcapital/copy-service/ReactEvaluator';

import copy from './some/path/to/copy.json';

const copyService = new CopyService();
copyService.registerCopy(copy);

const textEvaluator = new PlainTextEvaluator(copyService);
const reactEvaluator = new ReactEvaluator(copyService);

const stringCopy = textEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
const jsxCopy = reactEvaluator.getCopy('some.copy.key', { some: 'substitutions' });
```

## Contributing to Copy Service

**WARNING: This project involves complex technical concepts. Developing on this project will likely be more difficult than other projects.**

See [CONTRIBUTING.md](https://github.com/BLC/copy-service/blob/master/CONTRIBUTING.md).

