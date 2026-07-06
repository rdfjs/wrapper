import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { TermWrapper } from "@rdfjs/wrapper"
import { Child } from "./model/Child.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { Example } from "./vocabulary/Example.js"
import type { NamedNode, Quad_Subject, Term } from "@rdfjs/types"

const rdf = `
prefix : <https://example.org/>

<x> :hasString "string 1" .
`

await describe("Term Wrapper from", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Runtime behaviour", async () => {
        await it("creates an instance of the subclass it is invoked on", async () => {
            const child = Child.from("x", dataset, DataFactory)

            assert.equal(child instanceof Child, true)
            assert.equal(child instanceof TermWrapper, true)
        })

        await it("creates an instance of the base class when invoked on it", async () => {
            const wrapper = TermWrapper.from("x", dataset, DataFactory)

            assert.equal(wrapper instanceof TermWrapper, true)
        })

        await it("wraps a string as a named node, like the constructor", async () => {
            const child = Child.from("x", dataset, DataFactory)
            const constructed = new Child("x", dataset, DataFactory)

            assert.equal(child.termType, "NamedNode")
            assert.equal(child.value, "x")
            assert.equal(child.equals(constructed as Term), true)
            assert.equal(child.equals(DataFactory.namedNode("x")), true)
        })

        await it("wraps a given term instance, like the constructor", async () => {
            const child = Child.from(DataFactory.blankNode("b1"), dataset, DataFactory)

            assert.equal(child.termType, "BlankNode")
            assert.equal(child.value, "b1")
        })

        await it("exposes accessors of the subclass", async () => {
            const child = Child.from("x", dataset, DataFactory)

            assert.equal(child.hasString, "string 1")
        })

        await it("keeps references to the dataset and factory", async () => {
            const child = Child.from("x", dataset, DataFactory)

            assert.equal(child.dataset, dataset)
            assert.equal(child.factory, DataFactory)
        })
    })

    await describe("Intersection return type", async () => {
        await it("is assignable to term types without casts", async () => {
            const child = Child.from("x", dataset, DataFactory)

            // Compile-time assertions: no casts in any of the assignments below
            const node: NamedNode = child
            const subject: Quad_Subject = child

            assert.equal(node.equals(subject), true)
        })

        await it("can be used to create quads without casts", async () => {
            const child = Child.from("x", dataset, DataFactory)
            const quad = DataFactory.quad(child, DataFactory.namedNode(Example.hasString), DataFactory.literal("string 2"))

            assert.equal(quad.subject.equals(child), true)
        })

        await it("can be used to match quads in a dataset without casts", async () => {
            const child = Child.from("x", dataset, DataFactory)
            const matches = dataset.match(child)

            assert.equal(matches.size, 1)
        })

        await it("preserves the term type of the wrapped term", async () => {
            const literal = DataFactory.literal("some value", "en")
            const wrapped = Child.from(literal, dataset, DataFactory)

            // Compile-time assertion: literal members are available without casts
            assert.equal(wrapped.language, "en")
            assert.equal(wrapped.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })
    })
})
