# Wrapping Terms

A **TermWrapper** maps a single RDF resource (a named node or blank node) to a JavaScript object. Properties on the class correspond to RDF predicates.

## Extending TermWrapper

Every mapping class must extend `TermWrapper`:

```typescript
import { TermWrapper } from "@rdfjs/wrapper"

class Book extends TermWrapper {
    // properties go here
}
```

### Constructor

`TermWrapper` takes three arguments:

```typescript
new Book(term, dataset, factory)
```

| Parameter | Type | Description |
|---|---|---|
| `term` | `string \| Term` | The IRI (string) or RDF/JS `Term` identifying this resource. |
| `dataset` | `DatasetCore` | The RDF/JS dataset that backs this object. |
| `factory` | `DataFactory` | An RDF/JS data factory used to create terms and quads. |

When a plain string is passed as `term`, it is converted to a named node via `factory.namedNode(term)`.

---

## Reading Properties

### `singular(predicate, valueMapping)`

Returns exactly **one** value. Throws if there are zero or more than one matching triples.

```typescript
get title(): string {
    return this.singular("https://schema.org/name", ValueMapping.literalToString)
}
```

### `singularNullable(predicate, valueMapping)`

Returns **one or zero** values (`undefined` when no triple exists). Throws if there is more than one.

```typescript
get description(): string | undefined {
    return this.singularNullable("https://schema.org/description", ValueMapping.literalToString)
}
```

### `objects(predicate, valueMapping, termMapping)`

Returns a live **`Set`** of all matching objects.

```typescript
get authors(): Set<string> {
    return this.objects(
        "https://schema.org/author",
        ValueMapping.iriToString,
        TermMapping.stringToIri,
    )
}
```

---

## Writing Properties

### `overwrite(predicate, value, termMapping)`

Removes all existing triples for `predicate`, then adds a new triple. Throws if `value` is `undefined`.

```typescript
set title(value: string) {
    this.overwrite("https://schema.org/name", value, TermMapping.stringToLiteral)
}
```

### `overwriteNullable(predicate, value, termMapping)`

Removes all existing triples for `predicate`. If `value` is not `undefined`, adds a new triple.

```typescript
set description(value: string | undefined) {
    this.overwriteNullable("https://schema.org/description", value, TermMapping.stringToLiteral)
}
```

---

## Complete Example

<!-- example: term-wrapper -->
```typescript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class Book extends TermWrapper {
    get title(): string {
        return this.singular(SCHEMA + "name", ValueMapping.literalToString)
    }

    set title(value: string) {
        this.overwrite(SCHEMA + "name", value, TermMapping.stringToLiteral)
    }

    get isbn(): string | undefined {
        return this.singularNullable(SCHEMA + "isbn", ValueMapping.literalToString)
    }

    set isbn(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "isbn", value, TermMapping.stringToLiteral)
    }
}
```
<!-- /example -->

```typescript
import { DataFactory, Store } from "n3"

// --- Usage ---
const store = new Store()
const book = new Book("https://example.org/book1", store, DataFactory)

book.title = "RDF for Everyone"
book.isbn  = "978-0000000000"

console.log(book.title)  // "RDF for Everyone"
console.log(book.isbn)   // "978-0000000000"

book.isbn = undefined    // removes the triple
console.log(book.isbn)   // undefined
```

---

## Accessing the Underlying Term

`TermWrapper` implements the RDF/JS [`Term`](https://rdf.js.org/data-model-spec/#term-interface) interface, so you can access the underlying term directly:

```typescript
console.log(book.termType)  // "NamedNode"
console.log(book.value)     // "https://example.org/book1"
```

The `dataset` and `factory` passed at construction are also accessible:

```typescript
book.dataset  // the backing DatasetCore
book.factory  // the DataFactory
```
