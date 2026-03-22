// Examples extracted from docs/guides/nested-objects.md

import assert from "node:assert"
import { describe, it } from "node:test"
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

    get knows(): Person | undefined {
        return this.singularNullable(SCHEMA + "knows", ObjectMapping.as(Person))
    }
}

await describe("docs/guides/nested-objects — Person with Address Example", async () => {
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

    await it("reads name", async () => {
        assert.strictEqual(alice.name, "Alice")
    })

    await it("reads nested address street", async () => {
        assert.strictEqual(alice.address?.street, "1 Example Street")
    })

    await it("reads nested address city", async () => {
        assert.strictEqual(alice.address?.city, "Exampleville")
    })

    await it("sets address to undefined removes triple", async () => {
        alice.address = undefined
        assert.strictEqual(alice.address, undefined)
    })

    await it("sets address to a new TermWrapper instance", async () => {
        const newAddr = new Address("https://example.org/newAddr", store, DataFactory)
        newAddr.street = "2 New Street"
        alice.address = newAddr
        assert.strictEqual(alice.address?.street, "2 New Street")
    })
})

await describe("docs/guides/nested-objects — Recursive References", async () => {
    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        PREFIX ex:     <https://example.org/>

        ex:alice schema:name "Alice" ; schema:knows ex:bob .
        ex:bob   schema:name "Bob"   ; schema:knows ex:charlie .
        ex:charlie schema:name "Charlie" .
    `))

    const alice = new Person("https://example.org/alice", store, DataFactory)

    await it("navigates recursive relationships", async () => {
        assert.strictEqual(alice.knows?.knows?.name, "Charlie")
    })
})

await describe("docs/guides/nested-objects — Sets of Objects", async () => {
    class PersonWithFriends extends TermWrapper {
        get name(): string | undefined {
            return this.singularNullable(SCHEMA + "name", ValueMapping.literalToString)
        }

        get friends(): Set<PersonWithFriends> {
            return this.objects(
                SCHEMA + "knows",
                ObjectMapping.as(PersonWithFriends),
                ObjectMapping.as(PersonWithFriends),
            )
        }
    }

    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        PREFIX ex:     <https://example.org/>

        ex:alice schema:name "Alice" ; schema:knows ex:bob .
        ex:bob   schema:name "Bob" .
    `))

    const alice = new PersonWithFriends("https://example.org/alice", store, DataFactory)

    await it("returns friends as a Set", async () => {
        assert.strictEqual(alice.friends.size, 1)
        for (const friend of alice.friends) {
            assert.strictEqual(friend.name, "Bob")
        }
    })
})
