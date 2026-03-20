# TermWrapper API Reference

`TermWrapper` is the base class for all resource wrappers. It extends `AnyTermWithContext` which implements the RDF/JS [`Term`](https://rdf.js.org/data-model-spec/#term-interface) interface.

## Import

```typescript
import { TermWrapper } from "@rdfjs/wrapper"
```

## Constructor

```typescript
new TermWrapper(term: string | Term, dataset: DatasetCore, factory: DataFactory)
```

| Parameter | Type | Description |
|---|---|---|
| `term` | `string \| Term` | The IRI string or RDF/JS `Term` for this resource. |
| `dataset` | `DatasetCore` | The RDF/JS dataset backing this object. |
| `factory` | `DataFactory` | The RDF/JS data factory used to create terms and quads. |

A plain string is converted to a named node: `factory.namedNode(term)`.

## Properties

### `dataset`

```typescript
readonly dataset: DatasetCore
```

The backing dataset passed at construction.

### `factory`

```typescript
readonly factory: DataFactory
```

The data factory passed at construction.

### Term interface properties

`TermWrapper` exposes the full RDF/JS `Term` interface from the wrapped term:

| Property | Type | Description |
|---|---|---|
| `termType` | `string` | The term type (`"NamedNode"`, `"BlankNode"`, etc.) |
| `value` | `string` | The IRI or local identifier of the term. |
| `language` | `string` | For literals: the language tag. |
| `datatype` | `NamedNode` | For literals: the datatype IRI. |
| `direction` | `string` | For literals: the base direction. |

### `equals(other)`

```typescript
equals(other: Term | null | undefined): boolean
```

Returns `true` if this term is equal to `other` (delegates to the underlying term).

---

## Protected Methods

These methods are available inside subclasses.

### `singular<T>(predicate, valueMapping)`

```typescript
protected singular<T>(predicate: string, valueMapping: IValueMapping<T>): T
```

Reads exactly one triple for `predicate`. Returns the mapped value.

**Throws** if there are zero or more than one matching triples.

### `singularNullable<T>(predicate, valueMapping)`

```typescript
protected singularNullable<T>(predicate: string, valueMapping: IValueMapping<T>): T | undefined
```

Reads zero or one triple for `predicate`. Returns `undefined` when no triple exists.

**Throws** if there is more than one matching triple.

### `overwrite<T>(predicate, value, termMapping)`

```typescript
protected overwrite<T>(predicate: string, value: T, termMapping: ITermMapping<T>): void
```

Removes all existing triples for `predicate`, then adds a new triple for `value`.

**Throws** if `value` is `undefined`.

### `overwriteNullable<T>(predicate, value, termMapping)`

```typescript
protected overwriteNullable<T>(predicate: string, value: T | undefined, termMapping: ITermMapping<T>): void
```

Removes all existing triples for `predicate`. If `value` is not `undefined`, adds a new triple.

### `objects<T>(predicate, valueMapping, termMapping)`

```typescript
protected objects<T>(predicate: string, valueMapping: IValueMapping<T>, termMapping: ITermMapping<T>): Set<T>
```

Returns a live `Set<T>` of all objects of `predicate`. Changes to the set are immediately reflected in the dataset.

### `map<TKey, TValue>(predicate, valueMapping, termMapping)`

```typescript
protected map<TKey, TValue>(predicate: string, valueMapping: IValueMapping<[TKey, TValue]>, termMapping: ITermMapping<[TKey, TValue]>): Map<TKey, TValue>
```

Returns a live `Map<TKey, TValue>` where each triple's object is decoded as a `[key, value]` pair. Changes to the map are immediately reflected in the dataset.

---

## Symbol.toStringTag

```typescript
get [Symbol.toStringTag](): string
```

Returns the constructor name of the wrapper class, enabling `Object.prototype.toString` to return a meaningful string.
