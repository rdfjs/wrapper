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

Assuming the following RDF has been loaded in a dataset `dataset_x`:

```turtle
PREFIX ex: <https://example.org/>

ex:person1 ex:name "Alice" .
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

The `namedGraph` function creates a `DatasetCore` view over a single named graph, projecting its contents into the default graph. This lets you use any existing `TermWrapper` or `DatasetWrapper` classes unchanged, scoped to a specific graph.

```javascript
import { namedGraph, DatasetWrapper } from "@rdfjs/wrapper"

// Given a dataset with quads in a named graph:
// <ex:person1> <ex:name> "Alice" <ex:graph1> .
// <ex:person2> <ex:name> "Bob" <ex:graph1> .
// <ex:person1> <ex:name> "Charlie" .                  (default graph)

const graphView = namedGraph(DataFactory.namedNode("https://example.org/graph1"), dataset, DataFactory)

// graphView behaves as a DatasetCore containing only default graph quads:
// <ex:person1> <ex:name> "Alice" .
// <ex:person2> <ex:name> "Bob" .

// Wrap it with your existing classes:
class People extends DatasetWrapper {
    get all() {
        return this.subjectsOf("https://example.org/name", Person)
    }
}

const people = new People(graphView, DataFactory)
for (const person of people.all) {
    console.log(person.name)
}
// outputs "Alice", "Bob"  (Charlie is excluded — different graph)
```

Writes through the view are mapped back to the named graph in the underlying dataset:

```javascript
// Adding a quad through the view stores it in the named graph
graphView.add(DataFactory.quad(s, p, o))
// Equivalent to: dataset.add(DataFactory.quad(s, p, o, DataFactory.namedNode("https://example.org/graph1")))
```

Any attempt to use a non-default graph on the returned `DatasetCore` throws a `NamedGraphError`:

```javascript
// These all throw NamedGraphError:
graphView.add(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g")))
graphView.match(undefined, undefined, undefined, DataFactory.namedNode("https://other.org/g"))
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


## License

This work is dual-licensed under MIT and Apache 2.0.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: MIT OR Apache-2.0`
