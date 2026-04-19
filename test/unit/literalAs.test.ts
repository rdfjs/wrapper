import { describe, it } from "node:test"
import { LiteralAs, LiteralDatatypeError, NotifyingDatasetCoreWrapper, TermTypeError, TermWrapper, type DefaultDatasetCore, type Triple } from "@rdfjs/wrapper"
import { DataFactory, Store } from "n3"
import type { DataFactory as IDataFactory } from "@rdfjs/types"
import assert from "node:assert"

const factory = DataFactory as unknown as IDataFactory<Triple, Triple>
const dataset = (): DefaultDatasetCore => new NotifyingDatasetCoreWrapper(new Store()) as unknown as DefaultDatasetCore

// TODO: Cover other methods in LiteralAS
// TODO: Cover LiteralFrom
await describe("LiteralAs", async () => {
    await describe("uInt8Array", async () => {
        await it("throws when undefined", async () => {
            assert.throws(() => LiteralAs.uInt8Array(undefined!), ReferenceError)
        })

        await it("throws when null", async () => {
            assert.throws(() => LiteralAs.uInt8Array(null!), ReferenceError)
        })

        await it("throws when not term", async () => {
            assert.throws(() => LiteralAs.uInt8Array("" as any), TypeError)
        })

        await it("throws when not literal", async () => {
            const wrapper = new TermWrapper(DataFactory.blankNode(), dataset(), factory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), TermTypeError)
        })

        await it("throws when datatype mismatch", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("", DataFactory.namedNode("d")), dataset(), factory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), LiteralDatatypeError)
        })

        // TODO: Enable when Node 25
        await it("throws when illegal base64", {skip: "Browser functionality with Uint8Array.fromBase64"}, async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), dataset(), factory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), SyntaxError)
        })

        // TODO: Enable when Node 25
        await it("throws when illegal hex", {skip: "Browser functionality with Uint8Array.fromHex"}, async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), dataset(), factory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), SyntaxError)
        })

        await it("converts base64", async () => {
            const encoded = "MDEyMzQ1Njc4OQ=="
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), dataset(), factory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "base64"))

            assert.deepStrictEqual(LiteralAs.uInt8Array(wrapper), bytes)
        })

        await it("converts hex", async () => {
            const encoded = "30313233343536373839"
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), dataset(), factory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "hex"))

            assert.deepStrictEqual(LiteralAs.uInt8Array(wrapper), bytes)
        })
    })
})
