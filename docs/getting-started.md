# Getting Started

## Installation

Install the package from npm:

```sh
npm install @rdfjs/wrapper
```

An RDF/JS-compatible `DataFactory` and `DatasetCore` implementation is also required. [N3.js](https://github.com/rdfjs/N3.js) is a popular choice:

```sh
npm install n3
```

!!! note "Node.js version"
    RDF/JS Wrapper requires Node.js **≥ 24**.

## Basic Concepts

RDF/JS Wrapper bridges the gap between the triple-based RDF data model and idiomatic JavaScript objects. The two main abstractions are:

| Class | Purpose |
|---|---|
| `TermWrapper` | Wraps a single RDF term (typically a named node or blank node) and exposes its properties as JS getters/setters. |
| `DatasetWrapper` | Wraps an entire RDF dataset and provides helpers to query it and return `TermWrapper` instances. |

To map between RDF terms and JavaScript values you supply **mappings**:

| Mapping | Direction | Purpose |
|---|---|---|
| `ValueMapping` | RDF → JS | Convert an RDF term to a primitive value (string, number, Date, …). |
| `TermMapping` | JS → RDF | Convert a primitive value to an RDF term. |
| `ObjectMapping` | Both | Wrap/unwrap a child `TermWrapper` instance. |

## Your First Mapping

### 1. Define your class

```typescript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

const NAME = "https://schema.org/name"
const AGE  = "https://schema.org/age"

class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(NAME, ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable(NAME, value, TermMapping.stringToLiteral)
    }

    get age(): number | undefined {
        return this.singularNullable(AGE, ValueMapping.literalToNumber)
    }

    set age(value: number | undefined) {
        this.overwriteNullable(AGE, value, TermMapping.numberToLiteral)
    }
}
```

### 2. Load some RDF

```typescript
import { DataFactory, Parser, Store } from "n3"

const parser = new Parser()
const store = new Store()

const quads = parser.parse(`
    PREFIX schema: <https://schema.org/>
    <https://example.org/alice>
        schema:name "Alice" ;
        schema:age  "30"^^<http://www.w3.org/2001/XMLSchema#double> .
`)

store.addQuads(quads)
```

### 3. Instantiate and use your wrapper

```typescript
const alice = new Person("https://example.org/alice", store, DataFactory)

console.log(alice.name)  // "Alice"
console.log(alice.age)   // 30

alice.name = "Alicia"
console.log(alice.name)  // "Alicia"
```

Changes made through the wrapper are immediately reflected in the underlying dataset — there is no separate "save" step.

## Next Steps

- Learn how to query a dataset with [DatasetWrapper](guides/dataset-wrapper.md).
- Nest objects with [ObjectMapping](guides/nested-objects.md).
- Explore the full [ValueMapping](api/value-mapping.md) and [TermMapping](api/term-mapping.md) APIs.
- Use [decorators](guides/decorators.md) for a more declarative style.
