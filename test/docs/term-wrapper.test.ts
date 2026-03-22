import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import { Book } from "./examples/term-wrapper.js"

await describe("docs/guides/term-wrapper — Complete Example", async () => {
    const store = new Store()
    const book = new Book("https://example.org/book1", store, DataFactory)

    await it("sets and reads title", async () => {
        book.title = "RDF for Everyone"
        assert.strictEqual(book.title, "RDF for Everyone")
    })

    await it("sets and reads isbn", async () => {
        book.isbn = "978-0000000000"
        assert.strictEqual(book.isbn, "978-0000000000")
    })

    await it("clears isbn when set to undefined", async () => {
        book.isbn = undefined
        assert.strictEqual(book.isbn, undefined)
    })

    await it("exposes RDF/JS Term interface — termType", async () => {
        assert.strictEqual(book.termType, "NamedNode")
    })

    await it("exposes RDF/JS Term interface — value", async () => {
        assert.strictEqual(book.value, "https://example.org/book1")
    })

    await it("exposes dataset and factory", async () => {
        assert.strictEqual(book.dataset, store)
        assert.strictEqual(book.factory, DataFactory)
    })
})
