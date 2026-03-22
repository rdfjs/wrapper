# Sets and Maps

RDF allows a subject to have multiple triples with the same predicate. RDF/JS Wrapper exposes multi-valued properties as live JavaScript `Set` or `Map` objects.

## Sets

### `objects(predicate, valueMapping, termMapping)`

Returns a **live `Set<T>`** backed by the underlying dataset. Every read and write goes directly to the dataset.

```typescript
get tags(): Set<string> {
    return this.objects(
        "https://schema.org/keywords",
        ValueMapping.literalToString,
        TermMapping.stringToLiteral,
    )
}
```

The `Set` supports the full standard interface: `add`, `delete`, `has`, `size`, `clear`, and iteration.

### Example: Set of Primitive Values

<!-- example: sets-and-maps-article -->
```typescript
import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

export class Article extends TermWrapper {
    get tags(): Set<string> {
        return this.objects(
            "https://schema.org/keywords",
            ValueMapping.literalToString,
            TermMapping.stringToLiteral,
        )
    }
}
```
<!-- /example -->

```typescript
import { DataFactory, Store, Parser } from "n3"

const store = new Store()
store.addQuads(new Parser().parse(`
    PREFIX schema: <https://schema.org/>
    <https://example.org/article1>
        schema:keywords "rdf", "linked-data", "semantic-web" .
`))

const article = new Article("https://example.org/article1", store, DataFactory)

console.log(article.tags.size)          // 3
article.tags.add("sparql")
console.log(article.tags.has("sparql")) // true
article.tags.delete("rdf")
console.log(article.tags.size)          // 3
```

### Example: Set of Wrapped Objects

Use `ObjectMapping.as(Constructor)` as both the value mapping and the term mapping:

<!-- example: sets-and-maps-person -->
```typescript
import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"

export class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable("https://schema.org/name", ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable("https://schema.org/name", value, TermMapping.stringToLiteral)
    }

    get friends(): Set<Person> {
        return this.objects(
            "https://schema.org/knows",
            ObjectMapping.as(Person),
            ObjectMapping.as(Person),
        )
    }
}
```
<!-- /example -->

```typescript
import { DataFactory, Store } from "n3"

// --- Usage ---
const alice = new Person("https://example.org/alice", store, DataFactory)
const bob   = new Person("https://example.org/bob",   store, DataFactory)

alice.friends.add(bob)

for (const friend of alice.friends) {
    console.log(friend.name)
}
// Bob
```

---

## Maps

### `map(predicate, valueMapping, termMapping)`

Returns a **live `Map<TKey, TValue>`** where each triple's object is mapped to a key-value pair.

The `valueMapping` must return a `[key, value]` tuple, and the `termMapping` must accept a `[key, value]` tuple and produce the RDF term to store as the triple's object.

!!! note
    Maps are an advanced feature for specialised data models. For most use cases, sets are sufficient.

### Example: String-keyed Map

<!-- example: sets-and-maps-map -->
```typescript
import { TermWrapper } from "@rdfjs/wrapper"

export class Resource extends TermWrapper {
    /**
     * Expose language-tagged labels as a Map<lang, label>.
     * The RDF object is a language-tagged literal; we split it into [lang, string].
     */
    get labels(): Map<string, string> {
        return this.map(
            "https://www.w3.org/2000/01/rdf-schema#label",
            (termWrapper) => [termWrapper.language, termWrapper.value] as [string, string],
            ([lang, str], dataset, factory) => {
                return new TermWrapper(factory.literal(str, lang), dataset, factory)
            },
        )
    }
}
```
<!-- /example -->
