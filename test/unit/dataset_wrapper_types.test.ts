import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { ParentDataset } from "./model/ParentDataset.js"
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

await describe("DatasetWrapper type assertions", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdf), DataFactory)

    await describe("instancesOf returns subclass with term properties", async () => {
        await it("Parent has hasString and termType", () => {
            for (const parent of parentDataset.instancesOfParent) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
                assert.equal(typeof parent.value, "string")
                assert.equal(typeof parent.equals, "function")
            }
        })

        await it("Parent does not have Literal properties", () => {
            for (const parent of parentDataset.instancesOfParent) {
                // @ts-expect-error language does not exist on Parent & Quad_Subject
                void parent.language
                // @ts-expect-error direction does not exist on Parent & Quad_Subject
                void parent.direction
                // @ts-expect-error datatype does not exist on Parent & Quad_Subject
                void parent.datatype
            }
        })

        await it("Parent does not have Quad properties", () => {
            for (const parent of parentDataset.instancesOfParent) {
                // @ts-expect-error subject does not exist on Parent & Quad_Subject
                void parent.subject
                // @ts-expect-error predicate does not exist on Parent & Quad_Subject
                void parent.predicate
                // @ts-expect-error object does not exist on Parent & Quad_Subject
                void parent.object
                // @ts-expect-error graph does not exist on Parent & Quad_Subject
                void parent.graph
            }
        })
    })

    await describe("subjectsOf returns subclass with term properties", async () => {
        await it("Parent has hasString and termType", () => {
            for (const parent of parentDataset.subjectsOfHasChild) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
            }
        })

        await it("Parent does not have Literal properties", () => {
            for (const parent of parentDataset.subjectsOfHasChild) {
                // @ts-expect-error language does not exist on Parent & Quad_Subject
                void parent.language
                // @ts-expect-error datatype does not exist on Parent & Quad_Subject
                void parent.datatype
            }
        })
    })

    await describe("objectsOf returns subclass with term properties", async () => {
        await it("Child has hasString and termType", () => {
            for (const child of parentDataset.objectsOfHasChild) {
                assert.equal(typeof child.termType, "string")
                assert.equal(typeof child.value, "string")
            }
        })

        await it("Child does not have Literal properties", () => {
            for (const child of parentDataset.objectsOfHasChild) {
                // @ts-expect-error language does not exist on Child & Quad_Object
                void child.language
                // @ts-expect-error datatype does not exist on Child & Quad_Object
                void child.datatype
            }
        })

        await it("Child does not have Quad properties", () => {
            for (const child of parentDataset.objectsOfHasChild) {
                // @ts-expect-error subject does not exist on Child & Quad_Object
                void child.subject
                // @ts-expect-error predicate does not exist on Child & Quad_Object
                void child.predicate
                // @ts-expect-error graph does not exist on Child & Quad_Object
                void child.graph
            }
        })
    })

    await describe("matchSubjectsOf returns subclass with term properties", async () => {
        await it("Parent has hasString and termType", () => {
            for (const parent of parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany) {
                assert.equal(typeof parent.hasString, "string")
                assert.equal(typeof parent.termType, "string")
            }
        })

        await it("Parent does not have Literal properties", () => {
            for (const parent of parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany) {
                // @ts-expect-error language does not exist on Parent & Quad_Subject
                void parent.language
                // @ts-expect-error datatype does not exist on Parent & Quad_Subject
                void parent.datatype
            }
        })
    })

    await describe("matchObjectsOf returns subclass with term properties", async () => {
        await it("Child has hasString and termType", () => {
            for (const child of parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany) {
                assert.equal(typeof child.termType, "string")
                assert.equal(typeof child.value, "string")
            }
        })

        await it("Child does not have Literal properties", () => {
            for (const child of parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany) {
                // @ts-expect-error language does not exist on Child & Quad_Object
                void child.language
                // @ts-expect-error datatype does not exist on Child & Quad_Object
                void child.datatype
            }
        })
    })
})
