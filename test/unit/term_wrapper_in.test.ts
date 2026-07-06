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
<y> :hasString "string 2" .
<z> :hasString "string 3" .
`

await describe("Term Wrapper in", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Runtime behaviour", async () => {
        await it("returns a function that creates instances of the subclass it is invoked on", async () => {
            const child = Child.in(dataset, DataFactory)("x")

            assert.equal(child instanceof Child, true)
            assert.equal(child instanceof TermWrapper, true)
        })

        await it("returns a function that creates instances of the base class when invoked on it", async () => {
            const wrapper = TermWrapper.in(dataset, DataFactory)("x")

            assert.equal(wrapper instanceof TermWrapper, true)
        })

        await it("wraps a string as a named node, like the constructor", async () => {
            const child = Child.in(dataset, DataFactory)("x")
            const constructed = new Child("x", dataset, DataFactory)

            assert.equal(child.termType, "NamedNode")
            assert.equal(child.value, "x")
            assert.equal(child.equals(constructed as Term), true)
            assert.equal(child.equals(DataFactory.namedNode("x")), true)
        })

        await it("wraps a given term instance, like the constructor", async () => {
            const child = Child.in(dataset, DataFactory)(DataFactory.blankNode("b1"))

            assert.equal(child.termType, "BlankNode")
            assert.equal(child.value, "b1")
        })

        await it("binds the dataset and factory to every created instance", async () => {
            const wrap = Child.in(dataset, DataFactory)
            const x = wrap("x")
            const y = wrap("y")

            assert.equal(x.dataset, dataset)
            assert.equal(x.factory, DataFactory)
            assert.equal(y.dataset, dataset)
            assert.equal(y.factory, DataFactory)
        })

        await it("creates a new instance on every invocation", async () => {
            const wrap = Child.in(dataset, DataFactory)
            const first = wrap("x")
            const second = wrap("x")

            assert.notEqual(first, second)
            assert.equal(first.equals(second), true)
        })

        await it("maps many IRIs with one bound factory", async () => {
            const children = ["x", "y", "z"].map(Child.in(dataset, DataFactory))

            assert.deepEqual(
                children.map(child => child.hasString),
                ["string 1", "string 2", "string 3"],
            )
        })
    })

    await describe("Intersection return type", async () => {
        await it("is assignable to term types without casts", async () => {
            const child = Child.in(dataset, DataFactory)("x")

            // Compile-time assertions: no casts in any of the assignments below
            const node: NamedNode = child
            const subject: Quad_Subject = child

            assert.equal(node.equals(subject), true)
        })

        await it("can be used to match quads in a dataset without casts", async () => {
            const child = Child.in(dataset, DataFactory)("x")
            const matches = dataset.match(child, DataFactory.namedNode(Example.hasString))

            assert.equal(matches.size, 1)
        })

        await it("preserves the term type of the wrapped term", async () => {
            const literal = DataFactory.literal("some value", "en")
            const wrapped = Child.in(dataset, DataFactory)(literal)

            // Compile-time assertion: literal members are available without casts
            assert.equal(wrapped.language, "en")
            assert.equal(wrapped.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })
    })
})
