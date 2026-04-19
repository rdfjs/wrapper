import { dataFactory } from "./util/dataFactory.js"
import assert from "node:assert"
import { describe, it } from "node:test"
import { AsyncParentDataset } from "./model/AsyncParentDataset.js"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"
import { asyncN3StoreFactory } from "./util/asyncN3StoreFactory.js"

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
`

async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
    const arr: T[] = []
    for await (const x of it) {
        arr.push(x)
    }
    return arr
}

await describe("Async Dataset Wrappers", async () => {
    const parentDataset = new AsyncParentDataset(asyncDatasetFromRdf(rdf), dataFactory, asyncN3StoreFactory)

    await it("get instances of Parent as AsyncParent", async () => {
        const parents = await collect(parentDataset.instancesOfParent)
        assert.equal(parents.length, 1)
        for (const parent of parents) {
            assert.equal(await parent.hasString, "o1")
        }
    })

    await it("get subjects of hasChild as AsyncParent instances", async () => {
        const parents = await collect(parentDataset.subjectsOfHasChild)
        assert.equal(parents.length, 2)
        for (const parent of parents) {
            assert.equal(["o1", "o2"].includes((await parent.hasString)!), true)
        }
    })

    await it("get objects of hasChild as AsyncChild instances", async () => {
        const children = await collect(parentDataset.objectsOfHasChild)
        assert.equal(children.length, 2)
        for (const child of children) {
            assert.equal(["child string 1", "child string 4"].includes((await child.hasString)!), true)
        }
    })

    await it("get matching subjects of `?s ?p :Parent ?g` as AsyncParent instances", async () => {
        const parents = await collect(parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany)
        assert.equal(parents.length, 1)
        for (const parent of parents) {
            assert.equal(await parent.hasString, "o1")
        }
    })

    await it("get matching objects of `<x> :hasChild ?o ?g` as AsyncChild instances", async () => {
        const children = await collect(parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany)
        assert.equal(children.length, 1)
        for (const child of children) {
            assert.equal(await child.hasString, "child string 1")
        }
    })

    await it("iterates asynchronously", async () => {
        const all = await collect(parentDataset)
        assert.equal(all.length, 11)
        for (const x of all) {
            assert.equal(x.equals(x), true)
        }
    })

    await it("size resolves to triple count", async () => {
        assert.equal(await parentDataset.size, 11)
    })
})
