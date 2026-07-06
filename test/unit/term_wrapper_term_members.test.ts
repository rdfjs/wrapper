import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { TermWrapper } from "@rdfjs/wrapper"
import { Child } from "./model/Child.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import type { Literal, Quad } from "@rdfjs/types"

const rdf = `
prefix : <https://example.org/>

<x> :hasString "string 1" .
`

await describe("Term Wrapper term members", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Runtime behaviour", async () => {
        await it("delegates literal members to the wrapped literal", async () => {
            const literal: Literal = DataFactory.literal("lang string 1", "en")
            const wrapper = new TermWrapper<Literal>(literal, dataset, DataFactory)
            const asLiteral = wrapper as unknown as Literal

            assert.equal(asLiteral.language, literal.language)
            assert.equal(asLiteral.direction, literal.direction)
            assert.equal(asLiteral.datatype.value, literal.datatype.value)
        })

        await it("delegates quad members to the wrapped quad", async () => {
            const quad = DataFactory.quad(
                DataFactory.namedNode("https://example.org/s"),
                DataFactory.namedNode("https://example.org/p"),
                DataFactory.literal("o"),
            )
            const wrapper = new TermWrapper<Quad>(quad, dataset, DataFactory)
            const asQuad = wrapper as unknown as Quad

            assert.equal(asQuad.subject.equals(quad.subject), true)
            assert.equal(asQuad.predicate.equals(quad.predicate), true)
            assert.equal(asQuad.object.equals(quad.object), true)
            assert.equal(asQuad.graph.equals(quad.graph), true)
        })

        await it("delegates through subclasses", async () => {
            const literal = DataFactory.literal("lang string 1", "en")
            const child = new Child(literal, dataset, DataFactory)

            assert.equal((child as unknown as Literal).language, "en")
        })

        await it("reflects the absence of members on the wrapped term", async () => {
            const wrapper = new TermWrapper("x", dataset, DataFactory)

            assert.equal((wrapper as any).language, undefined)
            assert.equal((wrapper as any).datatype, undefined)
            assert.equal((wrapper as any).subject, undefined)
        })
    })

    await describe("Type surface", async () => {
        await it("narrows termType to that of the wrapped term", async () => {
            const literal = DataFactory.literal("lang string 1", "en")
            const wrapper = new TermWrapper<Literal>(literal, dataset, DataFactory)
            const termType: "Literal" = wrapper.termType

            assert.equal(termType, "Literal")
        })

        await it("does not declare members of specific term types", async () => {
            const wrapper = new TermWrapper("x", dataset, DataFactory)

            // @ts-expect-error language is only present on wrapped literals
            assert.equal(wrapper.language, undefined)
            // @ts-expect-error direction is only present on wrapped literals
            assert.equal(wrapper.direction, undefined)
            // @ts-expect-error datatype is only present on wrapped literals
            assert.equal(wrapper.datatype, undefined)
            // @ts-expect-error subject is only present on wrapped quads
            assert.equal(wrapper.subject, undefined)
            // @ts-expect-error predicate is only present on wrapped quads
            assert.equal(wrapper.predicate, undefined)
            // @ts-expect-error object is only present on wrapped quads
            assert.equal(wrapper.object, undefined)
            // @ts-expect-error graph is only present on wrapped quads
            assert.equal(wrapper.graph, undefined)
        })
    })
})
