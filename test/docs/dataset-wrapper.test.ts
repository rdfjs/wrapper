// Examples extracted from docs/guides/dataset-wrapper.md

import assert from "node:assert"
import { describe, it } from "node:test"
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
    get all(): Iterable<Person> {
        return this.instancesOf(SCHEMA + "Person", Person)
    }

    get named(): Iterable<Person> {
        return this.subjectsOf(SCHEMA + "name", Person)
    }
}

const store = new Store()
store.addQuads(new Parser().parse(`
    PREFIX schema: <https://schema.org/>
    PREFIX ex:     <https://example.org/>

    ex:alice a schema:Person ; schema:name "Alice" .
    ex:bob   a schema:Person ; schema:name "Bob" .
`))

const people = new People(store, DataFactory)

await describe("docs/guides/dataset-wrapper — Complete Example", async () => {
    await it("instancesOf yields all typed subjects", async () => {
        const names: string[] = []
        for (const person of people.all) {
            if (person.name !== undefined) {
                names.push(person.name)
            }
        }
        assert.strictEqual(names.length, 2)
        assert.ok(names.includes("Alice"))
        assert.ok(names.includes("Bob"))
    })

    await it("subjectsOf yields subjects with a given predicate", async () => {
        const names: string[] = []
        for (const person of people.named) {
            if (person.name !== undefined) {
                names.push(person.name)
            }
        }
        assert.strictEqual(names.length, 2)
        assert.ok(names.includes("Alice"))
        assert.ok(names.includes("Bob"))
    })

    await it("DatasetWrapper can be passed as DatasetCore to a TermWrapper", async () => {
        const alice = new Person("https://example.org/alice", people, DataFactory)
        assert.strictEqual(alice.name, "Alice")
    })

    await it("implements DatasetCore — size", async () => {
        // The dataset has: 2 rdf:type triples + 2 schema:name triples = 4
        assert.strictEqual(people.size, 4)
    })
})
