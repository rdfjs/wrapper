import { dataFactory } from "./util/dataFactory.js"
import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { ParentDataset } from "./model/ParentDataset.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { n3StoreFactory } from "./util/n3StoreFactory.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasString "o1" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
    :hasChildSet [
        :hasString "child string 2" ;
    ], [
        :hasString "child string 3" ;
    ] ;
.
<y>
    :hasString "o2" ;
    :hasChild <z> ;
.
<z>
    :hasString "child string 4" ;
.
`;


await describe("Dataset Wrappers", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdf), dataFactory, n3StoreFactory)

    await it("get instances of Parent as Parent", async () => {
        assert.equal(Array.from(parentDataset.instancesOfParent).length, 1)

        for (const parent of parentDataset.instancesOfParent) {
            assert.equal("o1", parent.hasString)
        }
    })

    await it("get subjects of hasChild as Parent instances", async () => {
        assert.equal(Array.from(parentDataset.subjectsOfHasChild).length, 2)

        for (const parent of parentDataset.subjectsOfHasChild) {
            assert.equal(true, ["o1", "o2"].includes(parent.hasString!))
        }
    })

    await it("get objects of hasChild as Child instances", async () => {
        assert.equal((Array.from(parentDataset.objectsOfHasChild).length), 2)

        for (const child of parentDataset.objectsOfHasChild) {
            assert.equal(["child string 1", "child string 4"].includes(child.hasString!), true)
        }
    })

    await it("get matching subjects of `?s ?p :Parent ?g` as Parent instances", async () => {
        assert.equal((Array.from(parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany).length), 1)

        for (const parent of parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany) {
            assert.equal("o1", parent.hasString)
        }
    })

    await it("get matching objects of `<x> :hasChild ?o ?g` as Child instances", async () => {
        assert.equal((Array.from(parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany).length), 1)

        for (const child of parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany) {
            assert.equal("child string 1", child.hasString)
        }
    })

    await it("iterates", async () => {
        assert.equal((Array.from(parentDataset).length), 11)

        for (const x of parentDataset) {
            assert.equal(x.equals(x), true)
        }
    })
})
