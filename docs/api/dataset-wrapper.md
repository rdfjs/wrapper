# DatasetWrapper API Reference

`DatasetWrapper` wraps an RDF/JS `DatasetCore` and provides helpers for querying it and returning typed `TermWrapper` instances. It also implements `DatasetCore` itself, so it can be passed anywhere a dataset is expected.

## Import

```typescript
import { DatasetWrapper } from "@rdfjs/wrapper"
```

## Constructor

```typescript
new DatasetWrapper(dataset: DatasetCore, factory: DataFactory)
```

| Parameter | Type | Description |
|---|---|---|
| `dataset` | `DatasetCore` | The RDF/JS dataset to wrap. |
| `factory` | `DataFactory` | The RDF/JS data factory. |

## DatasetCore Interface

`DatasetWrapper` implements the full RDF/JS `DatasetCore` interface:

| Method / Property | Description |
|---|---|
| `size` | Number of triples in the dataset. |
| `add(quad)` | Adds a quad. |
| `delete(quad)` | Deletes a quad. |
| `has(quad)` | Returns `true` if the quad exists. |
| `match(s?, p?, o?, g?)` | Returns a dataset containing quads matching the pattern. |
| `[Symbol.iterator]()` | Iterates over all quads. |

---

## Protected Methods

These methods are available inside subclasses.

### `subjectsOf<T>(predicate, Constructor)`

```typescript
protected *subjectsOf<T>(predicate: string, constructor: ITermWrapperConstructor<T>): Iterable<T>
```

Yields every subject that has at least one triple whose predicate matches `predicate`. Each subject is wrapped with `new Constructor(subject, this, this.factory)`.

```typescript
get authors(): Iterable<Author> {
    return this.subjectsOf("https://schema.org/author", Author)
}
```

### `objectsOf<T>(predicate, Constructor)`

```typescript
protected *objectsOf<T>(predicate: string, constructor: ITermWrapperConstructor<T>): Iterable<T>
```

Yields every object of triples whose predicate matches `predicate`. Each object is wrapped with `new Constructor(object, this, this.factory)`.

```typescript
get topics(): Iterable<Topic> {
    return this.objectsOf("https://schema.org/about", Topic)
}
```

### `instancesOf<T>(type, Constructor)`

```typescript
protected *instancesOf<T>(type: string, constructor: ITermWrapperConstructor<T>): Iterable<T>
```

Yields every subject `s` for which a triple `s rdf:type <type>` exists. Each subject is wrapped with `new Constructor(subject, this, this.factory)`.

```typescript
get people(): Iterable<Person> {
    return this.instancesOf("https://schema.org/Person", Person)
}
```

### `matchSubjectsOf<T>(Constructor, predicate?, object?, graph?)`

```typescript
protected *matchSubjectsOf<T>(
    constructor: ITermWrapperConstructor<T>,
    predicate?: Term,
    object?: Term,
    graph?: Term,
): Iterable<T>
```

Low-level method. Yields subjects matching the triple pattern `(?s predicate object graph)`. Each subject is wrapped with `Constructor`.

### `matchObjectsOf<T>(Constructor, subject?, predicate?, graph?)`

```typescript
protected *matchObjectsOf<T>(
    constructor: ITermWrapperConstructor<T>,
    subject?: Term,
    predicate?: Term,
    graph?: Term,
): Iterable<T>
```

Low-level method. Yields objects matching the triple pattern `(subject predicate ?o graph)`. Each object is wrapped with `Constructor`.

---

## Symbol.toStringTag

```typescript
get [Symbol.toStringTag](): string
```

Returns the constructor name of the dataset wrapper class.
