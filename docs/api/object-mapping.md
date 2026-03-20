# ObjectMapping API Reference

The `ObjectMapping` namespace provides mappings that work in both directions (value mapping and term mapping). They wrap RDF terms as typed `TermWrapper` instances and extract the underlying term from a `TermWrapper` when writing.

## Import

```typescript
import { ObjectMapping } from "@rdfjs/wrapper"
```

---

## ObjectMapping.as

```typescript
ObjectMapping.as<T>(constructor: ITermWrapperConstructor<T>): IValueMapping<T>
```

Returns a function that:

- **As a value mapping**: takes a `TermWrapper` and returns `new constructor(termWrapper, termWrapper.dataset, termWrapper.factory)`.
- **As a term mapping**: takes an instance of `T` (which must be a `TermWrapper`) and returns the underlying `TermWrapper`, which is written as the triple object.

Because it satisfies both `IValueMapping<T>` and `ITermMapping<T>`, the same call can be passed to both the getter and setter.

### Usage

```typescript
import { TermWrapper, ObjectMapping } from "@rdfjs/wrapper"

class Address extends TermWrapper { /* ... */ }

class Person extends TermWrapper {
    // getter: TermWrapper → Address
    get address(): Address | undefined {
        return this.singularNullable("https://schema.org/address", ObjectMapping.as(Address))
    }

    // setter: Address → TermWrapper
    set address(value: Address | undefined) {
        this.overwriteNullable("https://schema.org/address", value, ObjectMapping.as(Address))
    }

    // set: both directions
    get friends(): Set<Person> {
        return this.objects(
            "https://schema.org/knows",
            ObjectMapping.as(Person),
            ObjectMapping.as(Person),
        )
    }
}
```

---

## ObjectMapping.asList

```typescript
ObjectMapping.asList<T>(
    subject: TermWrapper,
    predicate: string,
    valueMapping: IValueMapping<T>,
    termMapping: ITermMapping<T>,
): IValueMapping<T[]>
```

Returns a value mapping that, when applied to a `TermWrapper` pointing to the head of an RDF Collection, returns an `RdfList<T>` — a live array backed by the RDF triples.

| Parameter | Type | Description |
|---|---|---|
| `subject` | `TermWrapper` | The owning subject (the `this` of the containing class). |
| `predicate` | `string` | The predicate IRI linking the subject to the list head. |
| `valueMapping` | `IValueMapping<T>` | Maps each list-item term to a JavaScript value. |
| `termMapping` | `ITermMapping<T>` | Maps a JavaScript value back to an RDF term (used when pushing/unshifting). |

### Usage

```typescript
import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"

const EX = "https://example.org/"

class Order extends TermWrapper {
    get items(): string[] | undefined {
        return this.singularNullable(
            EX + "items",
            ObjectMapping.asList(
                this,
                EX + "items",
                ValueMapping.literalToString,
                TermMapping.stringToLiteral,
            ),
        )
    }
}
```

See the [RDF Lists guide](../guides/rdf-lists.md) for a full walkthrough.

---

## ITermWrapperConstructor

The constructor type expected by `ObjectMapping.as`:

```typescript
interface ITermWrapperConstructor<T> {
    new(term: Term, dataset: DatasetCore, factory: DataFactory): T
}
```

Any class that extends `TermWrapper` and accepts the standard three-argument constructor satisfies this interface.
