# copy-service

A Javascript service for copy management.

## Features

* Allows for multiple sources of copy to be registered (via merging), allowing for tenant and application overrides of abstracted, generic copy.
* Supports references to other pieces of copy, reducing duplication.
* Supports dynamic and functional substitutions at runtime.
* Allows for copy to be outputed in different formats (string literals, HTML, React JSX, etc).

#### Why roll our own?

* We are Nextcapital, it's what we do.
* There is not another Javascript solution on the open market meeting our requirements and use cases that easily plug into our front-end applications at compile time.

## Structure

The copy-service package provides the CopyService class. Copy and an evaluator can be registered with each instance. As CopyService is not a singleton, multiple instances with different copy and/or different evaluators can exist. Note: Registered copy is not shared between CopyService instances.

Each evaluator transforms the parsed copy in formatted, consumable copy. The plain-text-evaluator returns string literal copy with no formatting (HTML) tags. The react-evaluator returns a React (JSX) component containing the copy and all formatting (such as inline HTML tags).

To consume this project, you need the copy-service package and an evaluator package.

## Consuming copy-service

See [CONSUMING.md](./CONSUMING.md).

## Developing copy-service

**WARNING: This project involves complex technical concepts. Developing on this project will likely be more difficult than other projects.**

See [CONTRIBUTING.md](./CONTRIBUTING.md).

