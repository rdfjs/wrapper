import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import type { DataFactory as IDataFactory, DatasetCore, Literal, Quad_Object, Quad_Predicate, Quad_Subject, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "@rdfjs/wrapper"
import { ParentDataset } from "./model/ParentDataset.js"
import { Parent } from "./model/Parent.js"
import { Child } from "./model/Child.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasString "o1" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
.
<y>
    :hasString "o2" ;
    :hasChild <z> ;
.
<z>
    :hasString "child string 4" ;
.
`

await describe("Dataset wrapper types", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdf), DataFactory)

    await describe("instancesOf", async () => {
        const parents = [...parentDataset.instancesOfParent]

        await it("yields wrappers exposing the members of the mapping class", () => {
            assert.equal(parents.length, 1)

            for (const parent of parents) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
                assert.equal(typeof parent.value, "string")
                assert.equal(typeof parent.equals, "function")
            }
        })

        await it("yields wrappers usable as subject terms without casts", () => {
            for (const parent of parents) {
                const subject: Quad_Subject = parent
                const quad = DataFactory.quad(parent, DataFactory.namedNode("p"), DataFactory.literal("o"))

                assert.equal(subject.equals(parent), true)
                assert.equal(quad.subject.equals(parent), true)
                assert.equal(parentDataset.match(parent).size, 3)
            }
        })

        await it("yields wrappers that are not literal or predicate terms", () => {
            for (const parent of parents) {
                // @ts-expect-error a matched subject is never a literal
                const literal: Literal = parent
                // @ts-expect-error a matched subject may be a blank node, which is not a valid predicate
                const predicate: Quad_Predicate = parent

                void literal
                void predicate
            }
        })
    })

    await describe("subjectsOf", async () => {
        const parents = [...parentDataset.subjectsOfHasChild]

        await it("yields wrappers exposing the members of the mapping class", () => {
            assert.equal(parents.length, 2)

            for (const parent of parents) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
            }
        })

        await it("yields wrappers usable as subject terms without casts", () => {
            for (const parent of parents) {
                const subject: Quad_Subject = parent

                assert.equal(subject.equals(parent), true)
            }
        })

        await it("yields wrappers that are not literal or predicate terms", () => {
            for (const parent of parents) {
                // @ts-expect-error a matched subject is never a literal
                const literal: Literal = parent
                // @ts-expect-error a matched subject may be a blank node, which is not a valid predicate
                const predicate: Quad_Predicate = parent

                void literal
                void predicate
            }
        })
    })

    await describe("objectsOf", async () => {
        const children = [...parentDataset.objectsOfHasChild]

        await it("yields wrappers exposing the members of the mapping class", () => {
            assert.equal(children.length, 2)

            for (const child of children) {
                assert.equal(typeof child.hasString, "string")
                assert.equal(typeof child.termType, "string")
                assert.equal(typeof child.value, "string")
            }
        })

        await it("yields wrappers usable as object terms without casts", () => {
            for (const child of children) {
                const object: Quad_Object = child
                const quad = DataFactory.quad(DataFactory.namedNode("s"), DataFactory.namedNode("p"), child)

                assert.equal(object.equals(child), true)
                assert.equal(quad.object.equals(child), true)
                assert.equal(parentDataset.match(undefined, undefined, child).size, 1)
            }
        })

        await it("yields wrappers that are not subject or predicate terms", () => {
            for (const child of children) {
                // @ts-expect-error a matched object may be a literal, which is not a valid subject
                const subject: Quad_Subject = child
                // @ts-expect-error a matched object may be a literal, which is not a valid predicate
                const predicate: Quad_Predicate = child

                void subject
                void predicate
            }
        })
    })

    await describe("matchSubjectsOf", async () => {
        const parents = [...parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany]

        await it("yields wrappers exposing the members of the mapping class", () => {
            assert.equal(parents.length, 1)

            for (const parent of parents) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
            }
        })

        await it("yields wrappers usable as subject terms without casts", () => {
            for (const parent of parents) {
                const subject: Quad_Subject = parent

                assert.equal(subject.equals(parent), true)
            }
        })

        await it("yields wrappers that are not literal terms", () => {
            for (const parent of parents) {
                // @ts-expect-error a matched subject is never a literal
                const literal: Literal = parent

                void literal
            }
        })
    })

    await describe("matchObjectsOf", async () => {
        const children = [...parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany]

        await it("yields wrappers exposing the members of the mapping class", () => {
            assert.equal(children.length, 1)

            for (const child of children) {
                assert.equal(typeof child.hasString, "string")
                assert.equal(typeof child.value, "string")
            }
        })

        await it("yields wrappers usable as object terms without casts", () => {
            for (const child of children) {
                const object: Quad_Object = child

                assert.equal(object.equals(child), true)
            }
        })

        await it("yields wrappers that are not subject terms", () => {
            for (const child of children) {
                // @ts-expect-error a matched object may be a literal, which is not a valid subject
                const subject: Quad_Subject = child

                void subject
            }
        })
    })

    await describe("ITermWrapperConstructor", async () => {
        await it("is satisfied automatically by classes derived from TermWrapper", () => {
            const parentConstructor: ITermWrapperConstructor<Parent> = Parent
            const childConstructor: ITermWrapperConstructor<Child> = Child

            assert.equal(parentConstructor, Parent)
            assert.equal(childConstructor, Child)
        })

        await it("rejects classes that do not derive from TermWrapper", () => {
            class PlainTermClass {
                public constructor(term: Term, dataset: DatasetCore, factory: IDataFactory) {
                    void term
                    void dataset
                    void factory
                }
            }

            // @ts-expect-error PlainTermClass does not derive from TermWrapper, so it lacks the from static factory
            const plainConstructor: ITermWrapperConstructor = PlainTermClass

            assert.equal(typeof plainConstructor, "function")
        })
    })
})
