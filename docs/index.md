# RDF/JS Wrapper

**An [RDF/JS](https://rdf.js.org/) object mapping library.**

[![Test Workflow](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml?query=branch%3Amain)
[![npm](https://img.shields.io/npm/v/@rdfjs/wrapper)](https://www.npmjs.com/package/@rdfjs/wrapper)

RDF/JS Wrapper lets you write idiomatic, object-oriented JavaScript and TypeScript over [RDF](https://www.w3.org/TR/rdf12-concepts/) data. Instead of working with raw triples, you define mapping classes that expose RDF properties as ordinary JavaScript class properties — complete with type-system support.

## Why RDF/JS Wrapper?

- **Familiar API** — read and write RDF data through standard JavaScript getters and setters.
- **Type safety** — full TypeScript support with generics for properties and mappings.
- **Reusable mappings** — define a class once and reuse it across any number of datasets or contexts.
- **No code generation** — class definitions are plain TypeScript; no build pipeline step is required.

## Quick Example

```typescript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable("https://schema.org/name", ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable("https://schema.org/name", value, TermMapping.stringToLiteral)
    }
}
```

Given an RDF dataset containing:

```turtle
<https://example.org/alice> <https://schema.org/name> "Alice" .
```

You can now work with that data as a plain JavaScript object:

```typescript
const alice = new Person("https://example.org/alice", dataset, DataFactory)

console.log(alice.name)  // "Alice"

alice.name = "Alicia"
console.log(alice.name)  // "Alicia"
```

## Documentation

Full documentation, including guides and API reference, is available at **[rdfjs.github.io/wrapper](https://rdfjs.github.io/wrapper)**.

## Installation

```sh
npm install @rdfjs/wrapper
```

Requires Node.js ≥ 24.

## License

Dual-licensed under [MIT](https://github.com/rdfjs/wrapper/blob/main/LICENSE.MIT.md) and [Apache 2.0](https://github.com/rdfjs/wrapper/blob/main/LICENSE.Apache-2.0.md) — choose either.

`SPDX-License-Identifier: MIT OR Apache-2.0`
