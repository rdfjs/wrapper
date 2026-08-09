# RDF/JS Wrapper

[![Test Workflow](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rdfjs/wrapper/actions/workflows/ci.yml?query=branch%3Amain)
[![npm](https://img.shields.io/npm/v/@rdfjs/wrapper)](https://www.npmjs.com/package/@rdfjs/wrapper)

An [RDF/JS](https://rdf.js.org/data-model-spec/) object mapping library.


## Purpose

The purpose of the RDF/JS Wrapper library is to enable idiomatic JavaScript object-oriented programming over RDF with type system support (TypeScript compatible).

In other words, [RDF data](https://en.wikipedia.org/wiki/Resource_Description_Framework) is abstracted away and developers can define standard mapping classes to program over it.

Additionally, standard mapping classes can be defined and reused in any number of context where they are relevant (see for example [@solid/object](https://github.com/solid/object)).

A guide and demo for using this library in the context of Solid and Next.js is available [here](https://dev.solidproject.org/guides/solid_nextjs_wrapper_demo_application/).

A script for generating mapping classes from SHACL shapes is available [here](https://github.com/theodi/shacl-shape-converter-typescript).


## Wrapping RDF

In order to wrap RDF, one needs an underlying data structure. Therefore, both `TermWrapper` and `DatasetWrapper` take an RDF/JS [Dataset](https://rdf.js.org/dataset-spec/#datasetcore-interface) and [Datafactory](https://rdf.js.org/data-model-spec/#datafactory-interface) as constructor parameters.


### Wrapping Terms

Term wrapping lets you manipulate data in a graph via class properties.

A [term](https://www.w3.org/TR/rdf12-concepts/#section-terms) wrapper instantiates a class from a term.

For example you can write a `Person` class with one `name` property:

```javascript
import { LiteralAs, LiteralFrom, OptionalAs, OptionalFrom, TermWrapper } from "https://unpkg.com/@rdfjs/wrapper"

class Person extends TermWrapper {
	get name() {
		return OptionalFrom.subjectPredicate(this, "https://example.org/name", LiteralAs.string)
	}

	set name(value) {
		OptionalAs.object(this, "https://example.org/name", value, LiteralFrom.string)
	}
}
```

Assuming the following RDF

```turtle
PREFIX ex: <https://example.org/>

ex:person1 ex:name "Alice" .
```

has been loaded into an RDF/JS dataset `dataset_x` (here using [N3.js](https://github.com/rdfjs/N3.js/) `Store`):
```js
const dataset_x = new N3.Store(new N3.Parser().parse(rdf)) // rdf holds the turtle above
```

Class usage:

```javascript
const person1 = new Person("https://example.org/person1", dataset_x, DataFactory)

// Get property
console.log(person1.name)
// outputs "Alice"

// Set property
person1.name = [...person1].reverse().join("")
console.log(person1.name)
// outputs "ecilA"
```


### Wrapping Datasets

Dataset wrapping lets you find data in a graph that is meant to be wrapped.

For example, you can write a `People` dataset wrapper to find each `Person` in a graph:

```javascript
class People extends DatasetWrapper {
	[Symbol.iterator]() {
		return this.subjectsOf("https://example.org/name", Person)
	}
}
```

Assuming the following RDF has been loaded in a dataset `dataset_y`:

```turtle
PREFIX ex: <https://example.org/>

ex:person1 ex:name "Alice" .
ex:person2 ex:name "Bob" .
```

Dataset Wrapper usage:

```javascript
const people = new People(dataset_y, DataFactory)

for (const person of people) {
	console.log(person.name)
}
// outputs
// Alice
// Bob
```


### Wrapping objects

For example you can write a `Person` class with one `name` and one `mum` property:

```javascript
import { LiteralAs, LiteralFrom, OptionalAs, OptionalFrom, TermAs, TermFrom, TermWrapper } from "https://unpkg.com/@rdfjs/wrapper"

class Person extends TermWrapper {
	get name() {
		return OptionalFrom.subjectPredicate(this, "https://example.org/name", LiteralAs.string)
	}

	set name(value) {
		OptionalAs.object(this, "https://example.org/name", value, LiteralFrom.string)
	}

	get mum() {
		return OptionalFrom.subjectPredicate(this, "https://example.org/mum", TermAs.instance(Person))
	}

	set mum(value) {
		OptionalAs.object(this, "https://example.org/mum", value, TermFrom.instance)
	}
}
```

Assuming the following RDF has been loaded in a dataset `dataset_z`:

```turtle
PREFIX ex: <https://example.org/>

ex:person1 ex:name "Alice" .

ex:person2
	ex:name "Bob" ;
	ex:mum ex:person2 ;
.
```

Class usage:

```javascript
const person2 = new Person("https://example.org/person2", dataset_z, DataFactory)

// Get property
console.log(person2.name)
// outputs "Bob"

// Get property from child class
console.log(person2.mum.name)
// outputs "Alice"

// Set class properties
const person3 = new Person("https://example.org/person3", dataset_z, DataFactory)
person3.name = "Joanne"
person1.mum = person3
console.log(person1.mum.name)
// outputs "Joanne"
console.log(person2.mum.mum.name)
// outputs "Joanne"
```


## Background

RDF/JS Wrapper uses the interfaces described in the [RDF/JS](https://rdf.js.org/) specifications.


### Named Graphs

The `GraphScopedDataset` class is a `DatasetWrapper` that exposes one or more named graphs of an underlying dataset projected onto the default graph. Existing `TermWrapper` and `DatasetWrapper` subclasses can be reused unchanged against quads that live in named graphs.

The recommended entry point is `DatasetWrapper.scoped`, which constructs the projection for you from a parent wrapper:

```javascript
import { DatasetWrapper, GraphScopedDataset } from "@rdfjs/wrapper"

class People extends GraphScopedDataset {
    get all() {
        return this.subjectsOf("https://example.org/name", Person)
    }
}

class Workspace extends DatasetWrapper {
    people(graphIri) {
        // Read from and write to the same named graph.
        return this.scoped(graphIri, [graphIri], People)
    }
}
```

Given the following RDF:

```turtle
PREFIX ex: <https://example.org/>

GRAPH ex:graph1 {
    ex:person1 ex:name "Alice" .
    ex:person2 ex:name "Bob" .
}

ex:person1 ex:name "Charlie" .   # default graph
```

```javascript
const ws = new Workspace(dataset, DataFactory, datasetFactory)
const team = ws.people("https://example.org/graph1")

for (const p of team.all) {
    console.log(p.name)
}
// outputs "Alice", "Bob"  (Charlie is excluded — different graph)
```

Writes through the view are mapped back into the configured `writeGraph`:

```javascript
team.add(DataFactory.quad(s, p, o))
// stored in the underlying dataset as:
// DataFactory.quad(s, p, o, DataFactory.namedNode("https://example.org/graph1"))
```

`writeGraph` and `readGraphs` need not be the same. Passing `undefined` for `readGraphs` reads from every graph (default and named) and deduplicates triples across them — useful for read-only union views:

```javascript
class ReadOnlyUnion extends GraphScopedDataset { /* ... */ }
const union = ws.scoped("https://example.org/scratch", undefined, ReadOnlyUnion)
```

Any attempt to use a non-default graph on the projected view throws a `NamedGraphError` (for `add` / `delete` / `has`) or a `TermTypeError` (for `match`):

```javascript
// These all throw:
team.add(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g")))      // NamedGraphError
team.match(undefined, undefined, undefined, DataFactory.namedNode("https://other.org/g")) // TermTypeError
```


### Change notifications

Every `DatasetWrapper` exposes `on(listener)` / `off(listener)` so consumers can react to additions and removals on the underlying dataset:

```javascript
const ds = new People(dataset, DataFactory, datasetFactory)

const listener = (event, quad) => {
    // event is "add" or "delete"
    console.log(event, quad.subject.value, quad.predicate.value, quad.object.value)
}
ds.on(listener)
// ...
ds.off(listener)
```

Notifications fire for **every** quad-level mutation, regardless of how it was triggered:

- direct `dataset.add(quad)` / `dataset.delete(quad)`
- a setter on a `TermWrapper` (`person.name = "..."`)
- mutations through a `WrappingSet` returned by `SetFrom`
- mutations through an `RdfList`
- writes made through a `GraphScopedDataset` view (the listener attached to the scoped view receives default-graph quads; the listener attached to the underlying dataset receives the rewritten named-graph quads)

Setters that *change* a value emit a `delete` for the previous quad followed by an `add` for the new quad. Clearing an optional value emits only `delete`. Setting from `undefined` emits only `add`.

#### Set-level notifications

`WrappingSet` (the type returned by `SetFrom.subjectPredicate`) also exposes `on` / `off`. The listener receives the mutation type and the **mapped JavaScript value** for that set's subject + predicate, so callers do not need to filter dataset-wide events themselves:

```javascript
import { SetFrom, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"

class Person extends TermWrapper {
    get children() {
        return SetFrom.subjectPredicate(this, "https://example.org/hasChild", TermAs.instance(Person), TermFrom.instance)
    }
}

const alice = new Person("https://example.org/alice", dataset, DataFactory)

alice.children.on((event, child) => console.log(event, child.value))

alice.children.add(bob)    // logs: add, https://example.org/bob
alice.children.delete(bob) // logs: delete, https://example.org/bob
```

The set is a **live view**: iterating `alice.children` always reflects the current state of the dataset, including additions made by other code paths.

`WrappingSet.off(listener)` is keyed by `(listener, subject, predicate)` rather than by instance, so it works correctly even when called on a fresh `WrappingSet` returned by a subsequent property access:

```javascript
alice.children.on(listener)
alice.children.off(listener) // detaches the listener attached above
```


### Async API

The library ships a parallel asynchronous surface for use with RDF/JS-shaped datasets that are themselves asynchronous (or that you want to expose through promises). Every type, class and mapping has a sync sibling and an async sibling; the names are prefixed with `Async`.

The shape of the async dataset interface mirrors RDF/JS `DatasetCore` with one deliberate exception: `match` returns another `AsyncDatasetCore` synchronously (the matched view is materialised lazily on iteration), while every other read/write returns a `Promise`. Iteration is exposed via `Symbol.asyncIterator`; there is no synchronous `Symbol.iterator`.

| Sync                                | Async                                       |
| ----------------------------------- | ------------------------------------------- |
| `DatasetCore`                       | `AsyncDatasetCore`                          |
| `NotifyingDatasetCore`              | `AsyncNotifyingDatasetCore`                 |
| `NotifyingDatasetCoreWrapper`       | `AsyncNotifyingDatasetCoreWrapper`          |
| `DatasetWrapper`                    | `AsyncDatasetWrapper`                       |
| `TermWrapper`                       | `AsyncTermWrapper`                          |
| `WrappingSet`                       | `AsyncWrappingSet`                          |
| `RequiredFrom` / `OptionalFrom`     | `AsyncRequiredFrom` / `AsyncOptionalFrom`   |
| `RequiredAs` / `OptionalAs`         | `AsyncRequiredAs` / `AsyncOptionalAs`       |
| `SetFrom`                           | `AsyncSetFrom`                              |
| `TermAs` / `LiteralAs`              | `AsyncTermAs` / `AsyncLiteralAs`            |
| `LiteralFrom` / `NamedNodeFrom` / `BlankNodeFrom` / `TermFrom` | _reused as-is_ (pure functions) |

#### Defining async wrappers

JavaScript property setters cannot be `async`, so write-mappings on async wrappers are exposed as `setX(value)` methods that return a `Promise`. Read-mappings are normal getters that return a `Promise`; set-mappings return an `AsyncWrappingSet`.

```javascript
import {
    AsyncLiteralAs, AsyncOptionalAs, AsyncOptionalFrom,
    AsyncRequiredAs, AsyncRequiredFrom,
    AsyncSetFrom, AsyncTermAs,
    AsyncTermWrapper,
    LiteralFrom, TermFrom,
} from "@rdfjs/wrapper"

class AsyncPerson extends AsyncTermWrapper {
    get name() {
        return AsyncRequiredFrom.subjectPredicate(this, "https://example.org/name", AsyncLiteralAs.string)
    }
    setName(value) {
        return AsyncRequiredAs.object(this, "https://example.org/name", value, LiteralFrom.string)
    }

    get nickname() {
        return AsyncOptionalFrom.subjectPredicate(this, "https://example.org/nickname", AsyncLiteralAs.string)
    }
    setNickname(value) {
        return AsyncOptionalAs.object(this, "https://example.org/nickname", value, LiteralFrom.string)
    }

    get children() {
        return AsyncSetFrom.subjectPredicate(this, "https://example.org/hasChild", AsyncTermAs.instance(AsyncPerson), TermFrom.instance)
    }
}
```

Usage:

```javascript
const alice = new AsyncPerson("https://example.org/alice", asyncDataset, DataFactory)

console.log(await alice.name)           // "Alice"
await alice.setName("Alicia")
console.log(await alice.name)           // "Alicia"

for await (const child of alice.children) {
    console.log(await child.name)
}
```

#### Async dataset wrappers

`AsyncDatasetWrapper` is the async counterpart of `DatasetWrapper`. The same `subjectsOf` / `objectsOf` / `instancesOf` / `matchSubjectsOf` / `matchObjectsOf` helpers are available, but they return `AsyncIterable` so callers iterate with `for await`:

```javascript
import { AsyncDatasetWrapper } from "@rdfjs/wrapper"

class People extends AsyncDatasetWrapper {
    get all() {
        return this.subjectsOf("https://example.org/name", AsyncPerson)
    }
}

const people = new People(asyncDataset, DataFactory, asyncDatasetFactory)
for await (const person of people.all) {
    console.log(await person.name)
}

console.log(await people.size) // resolves to a number
```

#### Bridging a synchronous dataset

`AsyncNotifyingDatasetCoreWrapper` accepts either an `AsyncDatasetCore` or any synchronous `DatasetCore` (e.g. an n3 `Store`), so existing sync stores can be exposed through the async pipeline without re-implementation:

```javascript
import { AsyncNotifyingDatasetCoreWrapper } from "@rdfjs/wrapper"
import { Store } from "n3"

const store = new Store()
const asyncDataset = new AsyncNotifyingDatasetCoreWrapper(store)

await asyncDataset.add(quad)
console.log(await asyncDataset.size)
```

You can also implement `AsyncNotifyingDatasetCoreFactory` to plug in a genuinely asynchronous backing store (database, remote SPARQL endpoint, etc.).

#### Async change notifications

`AsyncDatasetWrapper` and `AsyncWrappingSet` expose the same `on` / `off` shape as their sync siblings. Listeners may be `async` - the dispatcher awaits a returned promise before invoking the next listener:

```javascript
asyncDataset.on(async (event, quad) => {
    await sendToAuditLog(event, quad)
})

alice.children.on(async (event, child) => {
    console.log(event, await child.name)
})
```


## Background

Practically, to map RDF to objects, you need to:
1. Write a class or use an existing class that extends TermWrapper
1. Each class needs a [Term](https://rdf.js.org/data-model-spec/#term-interface), a [Dataset](https://rdf.js.org/dataset-spec/#dataset-interface), and a [DataFactory](https://rdf.js.org/data-model-spec/#datafactory-interface) to be instantiated
1. Each class property will have an associated www.w3.org/TR/rdf11-schema/#ch_properties (a string, generally a URL, that is defined by an [ontology/vocabulary)](https://www.w3.org/TR/owl-rdf-based-semantics/)
1. Each class property will have an associated arity (singular, singular nullable or set)
1. Each class property depending on its type can have:
    1. a corresponding value mapping to get values, that is translating RDF Terms to JavaScript [primitive values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures#primitive_values) (string, number, boolean...)
    1. a corresponding term mapping to set values, that is translating Javascript primitive values to RDF Terms
    1. a corresponding mapping to wrap child objects as a TermWrapper
    1. a corresponding mapping for sets of primitive values
1. Each class mutates the underlying Dataset that is passed to it at instantiation time


## How To?

### Publish the package

1. Run `npm version major | minor | patch` locally (see [npm-version](https://docs.npmjs.com/cli/v8/commands/npm-version))
1. [Draft a new release](https://github.com/theodi/wrapper/releases)
1. The [Continuous Deployment action](https://github.com/theodi/wrapper/actions/workflows/cd.yml) will be triggered and automatically publish to npm


## See also

- [RDF](https://en.wikipedia.org/wiki/Resource_Description_Framework)
- [Knowledge Graph](https://en.wikipedia.org/wiki/Knowledge_graph)

## History

The paradigm employed here originates in [@langsamu](https://github.com/langsamu)'s research on using the [Test case manifest vocabulary](https://www.w3.org/2001/sw/DataAccess/tests/test-manifest#) to implement [unit tests in Java for the UK National Archives](https://github.com/nationalarchives/kettle-jena-plugins/pull/26).

It was later used to implement a [.NET SHACL processor](https://github.com/dotnetrdf/dotnetrdf/pull/236) and expanded into a robust library in [Inrupt RDF Wrapping for Java](https://github.com/inrupt/rdf-wrapping-java/).

## License

This work is dual-licensed under MIT and Apache 2.0.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: MIT OR Apache-2.0`
