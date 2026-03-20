# RDF Lists

An [RDF Collection](https://www.w3.org/TR/rdf12-syntax/#section-Collection) (informally called an "RDF list") is a sequence of RDF terms encoded using `rdf:first`, `rdf:rest`, and `rdf:nil`. RDF/JS Wrapper provides `ObjectMapping.asList` to expose such a collection as a JavaScript **`Array`**.

## ObjectMapping.asList

```typescript
ObjectMapping.asList(subject, predicate, valueMapping, termMapping)
```

| Parameter | Type | Description |
|---|---|---|
| `subject` | `TermWrapper` | The owning subject that holds the list property. |
| `predicate` | `string` | The IRI of the property that points to the list head. |
| `valueMapping` | `IValueMapping<T>` | Mapping from RDF term to JavaScript value. |
| `termMapping` | `ITermMapping<T>` | Mapping from JavaScript value to RDF term. |

The returned value mapping is intended to be used with `singularNullable`:

```typescript
get items(): string[] | undefined {
    return this.singularNullable(
        "https://example.org/items",
        ObjectMapping.asList(this, "https://example.org/items", ValueMapping.literalToString, TermMapping.stringToLiteral),
    )
}
```

---

## Full Example

```typescript
import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"
import { DataFactory, Store, Parser } from "n3"

const EX = "https://example.org/"

class Playlist extends TermWrapper {
    get tracks(): string[] | undefined {
        return this.singularNullable(
            EX + "tracks",
            ObjectMapping.asList(
                this,
                EX + "tracks",
                ValueMapping.literalToString,
                TermMapping.stringToLiteral,
            ),
        )
    }
}

const store = new Store()
store.addQuads(new Parser().parse(`
    PREFIX ex:  <https://example.org/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    ex:playlist1 ex:tracks (
        "Track 1"
        "Track 2"
        "Track 3"
    ) .
`))

const playlist = new Playlist(EX + "playlist1", store, DataFactory)
const tracks = playlist.tracks!

console.log(tracks[0])     // "Track 1"
console.log(tracks.length) // 3

tracks.push("Track 4")
console.log(tracks.length) // 4

tracks.shift()
console.log(tracks[0])     // "Track 2"
```

---

## Supported Array Operations

`RdfList` implements the full JavaScript `Array` interface. The following mutating operations are supported:

| Method | Supported |
|---|---|
| `push(...items)` | ✅ |
| `pop()` | ✅ |
| `shift()` | ✅ |
| `unshift(...items)` | ✅ |
| `splice` | ❌ (throws) |
| `reverse` | ❌ (throws) |
| `sort` | ❌ (throws) |
| `copyWithin` | ❌ (throws) |
| `fill` | ❌ (throws) |

All non-mutating operations (`map`, `filter`, `find`, `includes`, `indexOf`, etc.) are supported and work by materialising the list.

---

## RDF Representation

An RDF list `(A B C)` attached to subject `ex:s` via predicate `ex:items` is represented as:

```turtle
ex:s ex:items _:node1 .
_:node1 rdf:first "A" ; rdf:rest _:node2 .
_:node2 rdf:first "B" ; rdf:rest _:node3 .
_:node3 rdf:first "C" ; rdf:rest rdf:nil .
```

Mutations performed through `RdfList` update these triples in place.
