import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { LiteralAs, RequiredFrom, TermWrapper } from "@rdfjs/wrapper"
import { Child } from "./model/Child.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { Example } from "./vocabulary/Example.js"
import type { Literal, NamedNode, Term } from "@rdfjs/types"

const rdf = `
prefix : <https://example.org/>

<x> :hasString "string 1" .
`

class NamedNodeChild extends TermWrapper<NamedNode> {
    public get hasString(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasString, LiteralAs.string)
    }
}

await describe("Term Wrapper generic", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Default type parameter", async () => {
        await it("wraps an IRI string as before", async () => {
            const wrapper = new TermWrapper("x", dataset, DataFactory)

            // Compile-time assertion: without inference the term type stays the full union
            const termType: Term["termType"] = wrapper.termType

            assert.equal(termType, "NamedNode")
            assert.equal(wrapper.value, "x")
        })

        await it("leaves subclasses that do not pass a type argument unchanged", async () => {
            const child = new Child(DataFactory.blankNode("b1"), dataset, DataFactory)

            assert.equal(child.termType, "BlankNode")
            assert.equal(child.value, "b1")
        })
    })

    await describe("Inference from the constructor", async () => {
        await it("narrows the term type of a wrapped named node", async () => {
            const wrapper = new TermWrapper(DataFactory.namedNode("x"), dataset, DataFactory)

            // Compile-time assertion: termType is narrowed to the literal type "NamedNode"
            const termType: "NamedNode" = wrapper.termType

            assert.equal(termType, "NamedNode")
        })

        await it("narrows the term type of a wrapped literal", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("some value", "en"), dataset, DataFactory)

            // Compile-time assertion: termType is narrowed to the literal type "Literal"
            const termType: "Literal" = wrapper.termType

            // @ts-expect-error the compiler knows a wrapped literal is never a named node
            wrapper.termType === "NamedNode"

            assert.equal(termType, "Literal")
        })

        await it("keeps term-type-specific getters available", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("some value", "en"), dataset, DataFactory)

            assert.equal(wrapper.language, "en")
        })
    })

    await describe("Narrowing wrapper unions", async () => {
        await it("discriminates wrappers by the term type they wrap", async () => {
            const wrappers: (TermWrapper<NamedNode> | TermWrapper<Literal>)[] = [
                new TermWrapper(DataFactory.namedNode("x"), dataset, DataFactory),
                new TermWrapper(DataFactory.literal("some value", "en"), dataset, DataFactory),
            ]

            for (const wrapper of wrappers) {
                if (wrapper.termType === "Literal") {
                    // Compile-time assertion: narrowed to TermWrapper<Literal> by the check above
                    const narrowed: TermWrapper<Literal> = wrapper

                    assert.equal(narrowed.language, "en")
                } else {
                    // Compile-time assertion: narrowed to TermWrapper<NamedNode> by the check above
                    const narrowed: TermWrapper<NamedNode> = wrapper

                    assert.equal(narrowed.value, "x")
                }
            }
        })

        await it("remains assignable to the default wrapper type", async () => {
            const narrowed = new TermWrapper(DataFactory.namedNode("x"), dataset, DataFactory)

            // Compile-time assertion: TermWrapper<NamedNode> is assignable to TermWrapper without casts
            const general: TermWrapper = narrowed

            assert.equal(general.termType, "NamedNode")
        })
    })

    await describe("Subclasses with an explicit type argument", async () => {
        await it("narrows the term type of instances", async () => {
            const child = new NamedNodeChild(DataFactory.namedNode("x"), dataset, DataFactory)

            // Compile-time assertion: termType is narrowed to the literal type "NamedNode"
            const termType: "NamedNode" = child.termType

            assert.equal(termType, "NamedNode")
        })

        await it("works with the mapping helpers", async () => {
            const child = new NamedNodeChild(DataFactory.namedNode("x"), dataset, DataFactory)

            assert.equal(child.hasString, "string 1")
        })
    })
})
