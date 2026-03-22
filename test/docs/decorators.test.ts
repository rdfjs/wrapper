import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store, Parser } from "n3"
import { Tag, Article } from "./examples/decorators-article.js"
import { ArticleManual, ArticleDecorated } from "./examples/decorators-equivalence.js"
import { Friend, PersonDecorated } from "./examples/decorators-person.js"

await describe("docs/guides/decorators — Article and Tag Example", async () => {
    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        PREFIX ex:     <https://example.org/>

        ex:article1
            schema:headline "RDF in Practice" ;
            schema:keywords ex:tag1, ex:tag2 .

        ex:tag1 schema:name "rdf" .
        ex:tag2 schema:name "linked-data" .
    `))

    const article = new Article("https://example.org/article1", store, DataFactory)

    await it("reads headline via decorated getter", async () => {
        assert.strictEqual(article.headline, "RDF in Practice")
    })

    await it("sets headline via decorated setter", async () => {
        article.headline = "RDF Mastery"
        assert.strictEqual(article.headline, "RDF Mastery")
    })

    await it("reads tags Set via decorated getter", async () => {
        assert.strictEqual(article.tags.size, 2)
        const tagNames = [...article.tags].map(t => t.name).sort()
        assert.deepStrictEqual(tagNames, ["linked-data", "rdf"])
    })
})

await describe("docs/guides/decorators — Equivalence to Manual Mappings", async () => {
    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        PREFIX ex:     <https://example.org/>
        ex:a1 schema:headline "Hello World" .
    `))

    await it("manual and decorated getters return identical results", async () => {
        const manual = new ArticleManual("https://example.org/a1", store, DataFactory)
        const decorated = new ArticleDecorated("https://example.org/a1", store, DataFactory)
        assert.strictEqual(manual.headline, decorated.headline)
    })
})

await describe("docs/api/decorators — Full Decorated Class Example", async () => {
    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX schema: <https://schema.org/>
        PREFIX ex:     <https://example.org/>

        ex:alice
            schema:name "Alice" ;
            schema:age  "30" ;
            schema:knows ex:bob .

        ex:bob schema:name "Bob" ; schema:age "25" .
    `))

    const alice = new PersonDecorated("https://example.org/alice", store, DataFactory)

    await it("reads name via decorator", async () => {
        assert.strictEqual(alice.name, "Alice")
    })

    await it("writes name via decorator setter", async () => {
        alice.name = "Alicia"
        assert.strictEqual(alice.name, "Alicia")
    })

    await it("reads age via decorator", async () => {
        assert.strictEqual(alice.age, 30)
    })

    await it("reads friends Set via decorator", async () => {
        assert.strictEqual(alice.friends.size, 1)
        for (const friend of alice.friends) {
            assert.strictEqual(friend.name, "Bob")
        }
    })

    await it("adds a friend to the Set via decorator", async () => {
        const charlie = new Friend("https://example.org/charlie", store, DataFactory)
        charlie.name = "Charlie"
        alice.friends.add(charlie)
        assert.strictEqual(alice.friends.size, 2)
    })
})

