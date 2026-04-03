import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { ParentDecorated } from "./model/ParentDecorated.js"
import { ChildDecorated } from "./model/ChildDecorated.js"

const rdf = `
prefix : <https://example.org/>

<x>
    :hasString "string 1" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
    :hasChildSet [
        :hasString "child string 2" ;
    ], [
        :hasString "child string 3" ;
    ] .
`

await describe("Decorators", async () => {
    const dataset = datasetFromRdf(rdf)
    const parentDecorated = new ParentDecorated(DataFactory.namedNode("x"), dataset, DataFactory)
    const newChild = new ChildDecorated(DataFactory.blankNode(), dataset, DataFactory)

    await describe("Term Mappings", async () => {
        await it("get single literal to string", async () => {
            assert.equal(parentDecorated.hasString, "string 1")
        })

        await it("get single wrapped term", async () => {
            assert.equal(parentDecorated.hasChild.hasString, "child string 1")
        })

        await it("get set of wrapped terms' single literal to string", async () => {
            for (const child of parentDecorated.hasChildSet) {
                assert.equal(["child string 2", "child string 3"].includes(child.hasString!), true)
            }
        })
    })

    await describe("Value Mappings", async () => {
        await it("set single literal to string", async () => {
            parentDecorated.hasString = "xxxxx"
            assert.equal(parentDecorated.hasString, "xxxxx")
        })

        await it("set single wrapped term", async () => {
            newChild.hasString = "new string"
            parentDecorated.hasChild = newChild
            assert.equal(parentDecorated.hasChild.hasString, "new string")
        })
    })
})
