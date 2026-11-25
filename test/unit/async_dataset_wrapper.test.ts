import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { AsyncParentDataset } from "./model/AsyncParentDataset.js"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

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

async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const items: T[] = []

    for await (const item of iterable) {
        items.push(item)
    }

    return items
}

await describe("Async Dataset Wrappers", async () => {
    const parentDataset = new AsyncParentDataset(asyncDatasetFromRdf(rdf), DataFactory)

    await it("get instances of Parent as AsyncParent", async () => {
        const parents = await toArray(parentDataset.instancesOfParent)
        assert.equal(parents.length, 1)

        for (const parent of parents) {
            assert.equal(await parent.hasString, "o1")
        }
    })

    await it("get subjects of hasChild as AsyncParent instances", async () => {
        const parents = await toArray(parentDataset.subjectsOfHasChild)
        assert.equal(parents.length, 2)

        for (const parent of parents) {
            assert.equal(["o1", "o2"].includes((await parent.hasString)!), true)
        }
    })

    await it("get objects of hasChild as AsyncChild instances", async () => {
        const children = await toArray(parentDataset.objectsOfHasChild)
        assert.equal(children.length, 2)

        for (const child of children) {
            assert.equal(["child string 1", "child string 4"].includes((await child.hasString)!), true)
        }
    })

    await it("get matching subjects of `?s ?p :Parent ?g` as AsyncParent instances", async () => {
        const parents = await toArray(parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany)
        assert.equal(parents.length, 1)

        for (const parent of parents) {
            assert.equal(await parent.hasString, "o1")
        }
    })

    await it("get matching objects of `<x> :hasChild ?o ?g` as AsyncChild instances", async () => {
        const children = await toArray(parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany)
        assert.equal(children.length, 1)

        for (const child of children) {
            assert.equal(await child.hasString, "child string 1")
        }
    })

    await it("iterates asynchronously", async () => {
        const quads = await toArray(parentDataset)
        assert.equal(quads.length, 11)

        for (const quad of quads) {
            assert.equal(quad.equals(quad), true)
        }
    })

    await it("size resolves to the number of quads", async () => {
        assert.equal(await parentDataset.size, 11)
    })

    await it("wraps a synchronous dataset", async () => {
        const syncBacked = new AsyncParentDataset(datasetFromRdf(rdf), DataFactory)
        assert.equal(await syncBacked.size, 11)

        const parents = await toArray(syncBacked.instancesOfParent)
        assert.equal(parents.length, 1)
    })

    await it("wraps a lazily produced synchronous dataset", async () => {
        const lazy = new AsyncParentDataset(() => Promise.resolve(datasetFromRdf(rdf)), DataFactory)
        assert.equal(await lazy.size, 11)
    })

    await it("adds, checks and deletes quads asynchronously", async () => {
        const dataset = new AsyncParentDataset(datasetFromRdf(""), DataFactory)
        const quad = DataFactory.quad(
            DataFactory.namedNode("https://example.org/s"),
            DataFactory.namedNode("https://example.org/p"),
            DataFactory.literal("o"),
        )

        assert.equal(await dataset.has(quad), false)
        assert.equal(await dataset.add(quad), dataset)
        assert.equal(await dataset.has(quad), true)
        assert.equal(await dataset.size, 1)
        assert.equal(await dataset.delete(quad), dataset)
        assert.equal(await dataset.has(quad), false)
        assert.equal(await dataset.size, 0)
    })

    await it("match returns an asynchronous view", async () => {
        const matched = await toArray(parentDataset.match(DataFactory.namedNode("x"), undefined, undefined, undefined))
        assert.equal(matched.length, 5)
    })
})
