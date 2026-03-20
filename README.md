# RDF/JS Wrapper

[![Test Workflow](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml?query=branch%3Amain)
[![npm](https://img.shields.io/npm/v/@rdfjs/wrapper)](https://www.npmjs.com/package/@rdfjs/wrapper)

An [RDF/JS](https://rdf.js.org/data-model-spec/) object mapping library.

Full documentation is available at **[rdfjs.github.io/wrapper](https://rdfjs.github.io/wrapper)**.


## Purpose

The purpose of the RDF/JS Wrapper library is to enable idiomatic JavaScript object-oriented programming over RDF with type system support (TypeScript compatible).

[RDF data](https://en.wikipedia.org/wiki/Resource_Description_Framework) is abstracted away so developers can define standard mapping classes to work over it. These classes can be defined once and reused in any context where they are relevant (see for example [@solid/object](https://github.com/solid/object)).


## Installation

```sh
npm install @rdfjs/wrapper
```

Requires Node.js ≥ 24.


## Quick Example

```javascript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

class Person extends TermWrapper {
    get name() {
        return this.singularNullable("https://schema.org/name", ValueMapping.literalToString)
    }

    set name(value) {
        this.overwriteNullable("https://schema.org/name", value, TermMapping.stringToLiteral)
    }
}
```

Given an RDF dataset containing:

```turtle
<https://example.org/alice> <https://schema.org/name> "Alice" .
```

Class usage:

```javascript
const alice = new Person("https://example.org/alice", dataset, DataFactory)

console.log(alice.name)  // "Alice"

alice.name = "Alicia"
console.log(alice.name)  // "Alicia"
```


## Wrapping Terms

`TermWrapper` wraps a single RDF resource (a named node or blank node). Properties on the class correspond to RDF predicates via **value mappings** (RDF → JS) and **term mappings** (JS → RDF).

```javascript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

class Book extends TermWrapper {
    get title() {
        return this.singular("https://schema.org/name", ValueMapping.literalToString)
    }

    set title(value) {
        this.overwrite("https://schema.org/name", value, TermMapping.stringToLiteral)
    }

    get isbn() {
        return this.singularNullable("https://schema.org/isbn", ValueMapping.literalToString)
    }

    set isbn(value) {
        this.overwriteNullable("https://schema.org/isbn", value, TermMapping.stringToLiteral)
    }
}
```


## Wrapping Datasets

`DatasetWrapper` wraps an entire RDF dataset and lets you query it, returning typed `TermWrapper` instances.

```javascript
import { DatasetWrapper } from "@rdfjs/wrapper"

class Library extends DatasetWrapper {
    get books() {
        return this.instancesOf("https://schema.org/Book", Book)
    }
}

const library = new Library(dataset, DataFactory)

for (const book of library.books) {
    console.log(book.title)
}
```


## Nested Objects

Use `ObjectMapping.as` to wrap related resources as typed objects:

```javascript
import { ObjectMapping } from "@rdfjs/wrapper"

class Person extends TermWrapper {
    get address() {
        return this.singularNullable("https://schema.org/address", ObjectMapping.as(Address))
    }

    set address(value) {
        this.overwriteNullable("https://schema.org/address", value, ObjectMapping.as(Address))
    }
}
```


## Decorators

A decorator-based alternative is available for a more declarative style:

```javascript
import { getter, setter, GetterArity, SetterArity, ValueMapping, TermMapping } from "@rdfjs/wrapper"

class Person extends TermWrapper {
    @getter("https://schema.org/name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name() { throw new Error() }

    @setter("https://schema.org/name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_) {}
}
```


## Documentation

- [Getting Started](https://rdfjs.github.io/wrapper/getting-started/)
- [Wrapping Terms](https://rdfjs.github.io/wrapper/guides/term-wrapper/)
- [Wrapping Datasets](https://rdfjs.github.io/wrapper/guides/dataset-wrapper/)
- [Nested Objects](https://rdfjs.github.io/wrapper/guides/nested-objects/)
- [Sets and Maps](https://rdfjs.github.io/wrapper/guides/sets-and-maps/)
- [RDF Lists](https://rdfjs.github.io/wrapper/guides/rdf-lists/)
- [Decorators](https://rdfjs.github.io/wrapper/guides/decorators/)
- [API Reference](https://rdfjs.github.io/wrapper/api/term-wrapper/)


## See also

- [RDF](https://en.wikipedia.org/wiki/Resource_Description_Framework)
- [Knowledge Graph](https://en.wikipedia.org/wiki/Knowledge_graph)
- [RDF/JS Specifications](https://rdf.js.org/)


## How to Publish

1. Run `npm version major | minor | patch` locally (see [npm-version](https://docs.npmjs.com/cli/v8/commands/npm-version))
1. [Draft a new release](https://github.com/rdfjs/wrapper/releases)
1. The [Continuous Deployment action](https://github.com/rdfjs/wrapper/actions/workflows/cd.yml) will be triggered and automatically publish to npm


## License

This work is dual-licensed under MIT and Apache 2.0.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: MIT OR Apache-2.0`
