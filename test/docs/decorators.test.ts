// Examples extracted from docs/guides/decorators.md and docs/api/decorators.md

import assert from "node:assert"
import { describe, it } from "node:test"
import {
    TermWrapper,
    ValueMapping,
    TermMapping,
    ObjectMapping,
    getter,
    setter,
    GetterArity,
    SetterArity,
} from "@rdfjs/wrapper"
import { DataFactory, Store, Parser } from "n3"

const SCHEMA = "https://schema.org/"

// --- Example from docs/guides/decorators.md ---

class Tag extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined {
        throw new Error()
    }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}
}

class Article extends TermWrapper {
    @getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
    get headline(): string {
        throw new Error()
    }

    @setter(SCHEMA + "headline", SetterArity.Singular, TermMapping.stringToLiteral)
    set headline(_: string) {}

    @getter(SCHEMA + "keywords", GetterArity.Set, ObjectMapping.as(Tag), ObjectMapping.as(Tag))
    get tags(): Set<Tag> {
        throw new Error()
    }
}

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

// --- Example from docs/guides/decorators.md: Equivalence to Manual Mappings ---

class ArticleManual extends TermWrapper {
    // Manual equivalent
    get headline(): string {
        return this.singular(SCHEMA + "headline", ValueMapping.literalToString)
    }
}

class ArticleDecorated extends TermWrapper {
    // Decorated
    @getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
    get headline(): string { throw new Error() }
}

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

// --- Full Decorated Class Example from docs/api/decorators.md ---
// Note: to avoid TypeScript's temporal dead zone error with self-referencing class
// decorators, we split the self-referential "knows" relationship into two classes.

class Friend extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined { throw new Error() }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}
}

class PersonDecorated extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined { throw new Error() }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}

    @getter(SCHEMA + "age", GetterArity.SingularNullable, ValueMapping.literalToNumber)
    get age(): number | undefined { throw new Error() }

    @setter(SCHEMA + "age", SetterArity.SingularNullable, TermMapping.numberToLiteral)
    set age(_: number | undefined) {}

    @getter(SCHEMA + "knows", GetterArity.Set, ObjectMapping.as(Friend), ObjectMapping.as(Friend))
    get friends(): Set<Friend> { throw new Error() }
}

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
