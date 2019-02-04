# Developing copy-service

**WARNING: This project involves complex technical concepts. Developing on this project will likely be more difficult than other projects.**

## Maintainers
[Jonathan Pierce (@nc-piercej)](https://github.com/nc-piercej)
[Mike Kreiser (@nc-kreiserm)](https://github.com/nc-kreiserm)

## Background

This project uses a parser-evaluator pattern on ASTs built on a defined grammar. The copy-service package is the parser responsible for tokenizing each piece of copy and parsing it into an AST of ES6 classes representing syntax. The evaluator is responsible for evaluating the AST generated for a given Copy Key into copy formatted as a string literal, HTML, JSX (React component), etc.

## Grammar

**WARNING: DO NOT MODIFY THIS GRAMMAR. Correct constructing a grammar is extremely difficult. Consult @nc-piercej on evaluating any changes.**

The grammar is left-recursive and therefore recursive-descent (easily) parsable.

Writing an LR parser would be significantly more difficult, so best to avoid complex grammars.

```
COPY :: *{ RESTRAINED RESTRAINED VERBATIM } COPY | ${ VERBATIM } COPY | #{ VERBATIM } COPY | VERBATIM COPY | ^{ RESTRAINED VERBATIM } COPY | ^{ RESTRAINED VERBATIM }[ ARGUMENTS | COPY nil

RESTRAINED :: *{ RESTRAINED RESTRAINED VERBATIM } RESTRAINED | ${ VERBATIM } RESTRAINED | #{ VERBATIM } RESTRAINED | ^{ RESTRAINED VERBATIM } RESTRAINED | VERBATIM RESTRAINED | | ^{ RESTRAINED VERBATIM }[ ARGUMENTS | }{ ARGUMENTS: VERBATIM ] | VERBATIM , ARGUMENTS

VERBATIM :: any string that does not begin with *{, #{, ^{, or ${
```

**NOTE: Many bothans died to bring you this grammar.**
