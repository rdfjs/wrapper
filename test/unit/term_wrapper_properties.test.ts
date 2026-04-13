import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { TermWrapper } from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const rdf = `
prefix xsd: <http://www.w3.org/2001/XMLSchema#>
<s> <p> "hello"@en .
`

await describe("Term-specific property visibility", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Literal properties are available when term is Literal", async () => {
        await it("language, direction, datatype exist at runtime and in types", () => {
            const literal = DataFactory.literal("hello", "en")
            const node = TermWrapper.from(literal, dataset, DataFactory)
            assert.equal(node.language, "en")
            assert.equal(node.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })
    })

    await describe("Quad properties are available when term is Quad", async () => {
        await it("subject, predicate, object, graph exist at runtime and in types", () => {
            const quad = DataFactory.quad(
                DataFactory.namedNode("s"),
                DataFactory.namedNode("p"),
                DataFactory.literal("o"),
            )
            const node = TermWrapper.from(quad, dataset, DataFactory)
            assert.equal(node.subject.value, "s")
            assert.equal(node.predicate.value, "p")
            assert.equal(node.object.value, "o")
        })
    })

    await describe("Literal properties are NOT on NamedNode", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            // @ts-expect-error language does not exist on NamedNode
            void node.language
            // @ts-expect-error direction does not exist on NamedNode
            void node.direction
            // @ts-expect-error datatype does not exist on NamedNode
            void node.datatype
        })
    })

    await describe("Literal properties are NOT on BlankNode", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            // @ts-expect-error language does not exist on BlankNode
            void node.language
            // @ts-expect-error direction does not exist on BlankNode
            void node.direction
            // @ts-expect-error datatype does not exist on BlankNode
            void node.datatype
        })
    })

    await describe("Literal properties are NOT on DefaultGraph", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from(DataFactory.defaultGraph(), dataset, DataFactory)
            // @ts-expect-error language does not exist on DefaultGraph
            void node.language
            // @ts-expect-error direction does not exist on DefaultGraph
            void node.direction
            // @ts-expect-error datatype does not exist on DefaultGraph
            void node.datatype
        })
    })

    await describe("Quad properties are NOT on NamedNode", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            // @ts-expect-error subject does not exist on NamedNode
            void node.subject
            // @ts-expect-error predicate does not exist on NamedNode
            void node.predicate
            // @ts-expect-error object does not exist on NamedNode
            void node.object
            // @ts-expect-error graph does not exist on NamedNode
            void node.graph
        })
    })

    await describe("Quad properties are NOT on Literal", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory)
            // @ts-expect-error subject does not exist on Literal
            void node.subject
            // @ts-expect-error predicate does not exist on Literal
            void node.predicate
            // @ts-expect-error object does not exist on Literal
            void node.object
            // @ts-expect-error graph does not exist on Literal
            void node.graph
        })
    })

    await describe("Quad properties are NOT on BlankNode", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            // @ts-expect-error subject does not exist on BlankNode
            void node.subject
            // @ts-expect-error predicate does not exist on BlankNode
            void node.predicate
            // @ts-expect-error object does not exist on BlankNode
            void node.object
            // @ts-expect-error graph does not exist on BlankNode
            void node.graph
        })
    })

    await describe("Common properties are always available", async () => {
        await it("termType and value exist on NamedNode", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            assert.equal(typeof node.termType, "string")
            assert.equal(typeof node.value, "string")
            assert.equal(typeof node.equals, "function")
        })

        await it("termType and value exist on Literal", () => {
            const node = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory)
            assert.equal(typeof node.termType, "string")
            assert.equal(typeof node.value, "string")
            assert.equal(typeof node.equals, "function")
        })
    })
})
