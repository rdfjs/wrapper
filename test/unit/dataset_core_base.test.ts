import { dataFactory } from "./util/dataFactory.js"
import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Triple as N3Triple } from "n3"
import { ParentDataset } from "./model/ParentDataset.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { n3StoreFactory } from "./util/n3StoreFactory.js"
import { defaultGraph, type Triple } from "@rdfjs/wrapper"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasString "o1" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
    :hasChildSet [
        :hasString "1" ;
    ], [
        :hasString "2" ;
    ] ;
.
`;

await describe("Dataset Core Bases", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdf), dataFactory, n3StoreFactory)
    const newQuad = DataFactory.quad<Triple, N3Triple & Triple>(DataFactory.blankNode(), DataFactory.namedNode("x"), DataFactory.literal("x"))

    await it("get size", async () => {
        assert.equal(parentDataset.size, 8)
    })

    await it("add quad", async () => {
        parentDataset.add(newQuad)
        assert.equal(parentDataset.size, 9)
    })

    await it("add the same quad twice", async () => {
        parentDataset.add(newQuad)
        assert.equal(parentDataset.size, 9)
    })

    await it("has quad", async () => {
        assert.equal(parentDataset.has(newQuad), true)
    })

    await it("delete quad", async () => {
        parentDataset.delete(newQuad)
        assert.equal(parentDataset.size, 8)
        assert.equal(parentDataset.has(newQuad), false)
    })

    await it("match quads", async () => {
        parentDataset.add(newQuad)
        assert.equal((Array.from(parentDataset.match(newQuad.subject, newQuad.predicate, newQuad.object, defaultGraph)).length), 1)
        parentDataset.delete(newQuad)
        assert.equal((Array.from(parentDataset.match(newQuad.subject, newQuad.predicate, newQuad.object, defaultGraph)).length), 0)
    })
})
