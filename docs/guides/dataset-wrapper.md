# Wrapping Datasets

A **DatasetWrapper** wraps an entire RDF dataset and provides helper methods to query it, returning typed `TermWrapper` instances.

## Extending DatasetWrapper

```typescript
import { DatasetWrapper } from "@rdfjs/wrapper"
import { Person } from "./Person.js"

class People extends DatasetWrapper {
    // query methods go here
}
```

### Constructor

```typescript
new People(dataset, factory)
```

| Parameter | Type | Description |
|---|---|---|
| `dataset` | `DatasetCore` | The RDF/JS dataset to wrap. |
| `factory` | `DataFactory` | An RDF/JS data factory. |

`DatasetWrapper` itself implements the RDF/JS `DatasetCore` interface, so it can be passed anywhere a `DatasetCore` is expected — including as the `dataset` argument to a `TermWrapper`.

---

## Querying the Dataset

### `subjectsOf(predicate, Constructor)`

Yields every **subject** that has at least one triple with the given predicate.

```typescript
get people(): Iterable<Person> {
    return this.subjectsOf("https://schema.org/name", Person)
}
```

### `objectsOf(predicate, Constructor)`

Yields every **object** that appears as the object of the given predicate.

```typescript
get names(): Iterable<Name> {
    return this.objectsOf("https://schema.org/name", Name)
}
```

### `instancesOf(type, Constructor)`

Yields every subject that has an `rdf:type` triple with the given type IRI.

```typescript
get people(): Iterable<Person> {
    return this.instancesOf("https://schema.org/Person", Person)
}
```

### `matchSubjectsOf(Constructor, predicate?, object?, graph?)`

A lower-level method that yields subjects matching an arbitrary triple pattern.

```typescript
get alicesFriends(): Iterable<Person> {
    return this.matchSubjectsOf(
        Person,
        this.factory.namedNode("https://schema.org/knows"),
        this.factory.namedNode("https://example.org/alice"),
    )
}
```

### `matchObjectsOf(Constructor, subject?, predicate?, graph?)`

A lower-level method that yields objects matching an arbitrary triple pattern.

```typescript
get alicesHobbies(): Iterable<Hobby> {
    return this.matchObjectsOf(
        Hobby,
        this.factory.namedNode("https://example.org/alice"),
        this.factory.namedNode("https://schema.org/knowsAbout"),
    )
}
```

---

## Complete Example

```typescript
import { DatasetWrapper, TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"
import { DataFactory, Parser, Store } from "n3"

const SCHEMA = "https://schema.org/"

class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "name", value, TermMapping.stringToLiteral)
    }
}

class People extends DatasetWrapper {
    /** All people in the dataset (via rdf:type schema:Person). */
    get all(): Iterable<Person> {
        return this.instancesOf(SCHEMA + "Person", Person)
    }

    /** All subjects that have a schema:name property. */
    get named(): Iterable<Person> {
        return this.subjectsOf(SCHEMA + "name", Person)
    }
}

// --- Usage ---
const store = new Store()
store.addQuads(new Parser().parse(`
    PREFIX schema: <https://schema.org/>
    PREFIX ex:     <https://example.org/>

    ex:alice a schema:Person ; schema:name "Alice" .
    ex:bob   a schema:Person ; schema:name "Bob" .
`))

const people = new People(store, DataFactory)

for (const person of people.all) {
    console.log(person.name)
}
// Alice
// Bob
```

---

## DatasetWrapper as a DatasetCore

Because `DatasetWrapper` implements `DatasetCore`, you can pass it directly to `TermWrapper` instances:

```typescript
// people is a DatasetWrapper — it can be used as the dataset for a TermWrapper
const alice = new Person("https://example.org/alice", people, DataFactory)
console.log(alice.name)  // "Alice"
```

This makes it easy to build layered wrappers where a dataset wrapper acts as both a query interface and a backing store for term wrappers.
