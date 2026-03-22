import { describe, it } from "node:test"
import { LiteralDatatypeError, TermAs, TermTypeError, TermWrapper } from "@rdfjs/wrapper"
import { DataFactory, Store } from "n3"
import assert from "node:assert"

// TODO: Cover other methods in TermAS
// TODO: Cover TermFrom
await describe("TermAs", async () => {
    await describe("uInt8Array", async () => {
        await it("throws when undefined", async () => {
            assert.throws(() => TermAs.uInt8Array(undefined!), ReferenceError)
        })

        await it("throws when null", async () => {
            assert.throws(() => TermAs.uInt8Array(null!), ReferenceError)
        })

        await it("throws when not term", async () => {
            assert.throws(() => TermAs.uInt8Array("" as any), TypeError)
        })

        await it("throws when not literal", async () => {
            const wrapper = new TermWrapper(DataFactory.blankNode(), new Store(), DataFactory)

            assert.throws(() => TermAs.uInt8Array(wrapper), TermTypeError)
        })

        await it("throws when datatype mismatch", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("", DataFactory.namedNode("d")), new Store(), DataFactory)

            assert.throws(() => TermAs.uInt8Array(wrapper), LiteralDatatypeError)
        })

        await it("throws when illegal base64", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), new Store(), DataFactory)

            assert.throws(() => TermAs.uInt8Array(wrapper), SyntaxError)
        })

        await it("throws when illegal hex", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), new Store(), DataFactory)

            assert.throws(() => TermAs.uInt8Array(wrapper), SyntaxError)
        })

        await it("converts base64", async () => {
            const encoded = "MDEyMzQ1Njc4OQ=="
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), new Store(), DataFactory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "base64"))

            assert.deepStrictEqual(TermAs.uInt8Array(wrapper), bytes)
        })

        await it("converts hex", async () => {
            const encoded = "30313233343536373839"
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), new Store(), DataFactory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "hex"))

            assert.deepStrictEqual(TermAs.uInt8Array(wrapper), bytes)
        })
    })
})
