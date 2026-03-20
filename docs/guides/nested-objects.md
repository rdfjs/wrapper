# Nested Objects

RDF resources often link to other resources. **ObjectMapping** lets you wrap child resources as typed `TermWrapper` instances, so you can navigate related objects using ordinary JavaScript property accesses.

## ObjectMapping.as

`ObjectMapping.as(Constructor)` returns a mapping function that:

- **reads** (as a `ValueMapping`) — wraps the target term in a new `Constructor` instance backed by the same dataset and factory.
- **writes** (as a `TermMapping`) — extracts the underlying term from a `TermWrapper` instance and stores it as the object of a triple.

```typescript
import { ObjectMapping } from "@rdfjs/wrapper"

get address(): Address {
    return this.singular("https://schema.org/address", ObjectMapping.as(Address))
}

set address(value: Address) {
    this.overwrite("https://schema.org/address", value, ObjectMapping.as(Address))
}
```

Because it acts as both a value mapping and a term mapping, a single `ObjectMapping.as(...)` call can be used for both the getter and the setter.

---

## Example: Person with Address

```typescript
import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"
import { DataFactory, Store, Parser } from "n3"

const SCHEMA = "https://schema.org/"

class Address extends TermWrapper {
    get street(): string | undefined {
        return this.singularNullable(SCHEMA + "streetAddress", ValueMapping.literalToString)
    }

    set street(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "streetAddress", value, TermMapping.stringToLiteral)
    }

    get city(): string | undefined {
        return this.singularNullable(SCHEMA + "addressLocality", ValueMapping.literalToString)
    }
}

class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
    }

    get address(): Address | undefined {
        return this.singularNullable(SCHEMA + "address", ObjectMapping.as(Address))
    }

    set address(value: Address | undefined) {
        this.overwriteNullable(SCHEMA + "address", value, ObjectMapping.as(Address))
    }
}

// --- Usage ---
const store = new Store()
store.addQuads(new Parser().parse(`
    PREFIX schema: <https://schema.org/>
    PREFIX ex:     <https://example.org/>

    ex:alice
        schema:name    "Alice" ;
        schema:address ex:aliceAddr .

    ex:aliceAddr
        schema:streetAddress   "1 Example Street" ;
        schema:addressLocality "Exampleville" .
`))

const alice = new Person("https://example.org/alice", store, DataFactory)

console.log(alice.name)                // "Alice"
console.log(alice.address?.street)    // "1 Example Street"
console.log(alice.address?.city)      // "Exampleville"
```

---

## Recursive References

A class can reference itself through `ObjectMapping.as`. The mapping is lazily evaluated, so circular relationships are safe as long as you don't follow them infinitely in code.

```typescript
class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
    }

    get knows(): Person | undefined {
        return this.singularNullable(SCHEMA + "knows", ObjectMapping.as(Person))
    }
}

// Navigate a chain of relationships
console.log(alice.knows?.knows?.name)
```

---

## Sets of Objects

To expose a multi-valued property as a `Set` of wrapped objects, use `objects()` with `ObjectMapping.as(...)` as both value and term mapping:

```typescript
get friends(): Set<Person> {
    return this.objects(
        SCHEMA + "knows",
        ObjectMapping.as(Person),
        ObjectMapping.as(Person),
    )
}
```

See the [Sets and Maps](sets-and-maps.md) guide for details.
