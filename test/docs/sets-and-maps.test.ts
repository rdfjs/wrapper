// Examples extracted from docs/guides/sets-and-maps.md

import assert from "node:assert"
import { describe, it } from "node:test"
import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"
import { DataFactory, Store, Parser } from "n3"

await describe("docs/guides/sets-and-maps — Set of Primitive Values", async () => {
    class Article extends TermWrapper {
        get tags(): Set<string> {
            return this.objects(
                "https://schema.org/keywords",
                ValueMapping.literalToString,
                TermMapping.stringToLiteral,
            )
        }
    }

    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        <https://example.org/article1>
            schema:keywords "rdf", "linked-data", "semantic-web" .
    `))

    const article = new Article("https://example.org/article1", store, DataFactory)

    await it("has correct initial size", async () => {
        assert.strictEqual(article.tags.size, 3)
    })

    await it("add increases size and has returns true", async () => {
        article.tags.add("sparql")
        assert.strictEqual(article.tags.has("sparql"), true)
    })

    await it("delete decreases size", async () => {
        article.tags.delete("rdf")
        // 3 original + 1 added - 1 deleted = 3
        assert.strictEqual(article.tags.size, 3)
    })
})

await describe("docs/guides/sets-and-maps — Set of Wrapped Objects", async () => {
    class Person extends TermWrapper {
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

    const store = new Store()
    const alice = new Person("https://example.org/alice", store, DataFactory)
    const bob = new Person("https://example.org/bob", store, DataFactory)
    bob.name = "Bob"

    await it("starts with empty friends set", async () => {
        assert.strictEqual(alice.friends.size, 0)
    })

    await it("adding a friend increases size", async () => {
        alice.friends.add(bob)
        assert.strictEqual(alice.friends.size, 1)
    })

    await it("friend name is accessible through the set", async () => {
        for (const friend of alice.friends) {
            assert.strictEqual(friend.name, "Bob")
        }
    })
})

await describe("docs/guides/sets-and-maps — Map of Language Strings", async () => {
    class Resource extends TermWrapper {
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

    const store = new Store()
    store.addQuads(new Parser().parse(`
        <https://example.org/r1>
            <https://www.w3.org/2000/01/rdf-schema#label> "hello"@en, "bonjour"@fr .
    `))

    const resource = new Resource("https://example.org/r1", store, DataFactory)

    await it("reads language-keyed labels as a Map", async () => {
        assert.strictEqual(resource.labels.size, 2)
        assert.strictEqual(resource.labels.get("en"), "hello")
        assert.strictEqual(resource.labels.get("fr"), "bonjour")
    })

    await it("map entry can be updated via set", async () => {
        resource.labels.set("en", "hi")
        assert.strictEqual(resource.labels.get("en"), "hi")
    })
})
