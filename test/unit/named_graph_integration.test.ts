import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import { namedGraph } from "@rdfjs/wrapper"
import { Parent } from "./model/Parent.js"
import { ParentDataset } from "./model/ParentDataset.js"
import { Example } from "./vocabulary/Example.js"

const graph = DataFactory.namedNode("https://example.org/graph")

function storeWithGraphData(): Store {
    const store = new Store()
    const s = DataFactory.namedNode("x")

    // Data in the named graph
    store.addQuad(DataFactory.quad(s, DataFactory.namedNode(Example.hasString), DataFactory.literal("graph string"), graph))
    store.addQuad(DataFactory.quad(s, DataFactory.namedNode(Example.hasChild), DataFactory.blankNode("c1"), graph))
    store.addQuad(DataFactory.quad(DataFactory.blankNode("c1"), DataFactory.namedNode(Example.hasString), DataFactory.literal("graph child string"), graph))
    store.addQuad(DataFactory.quad(s, DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), DataFactory.namedNode(Example.Parent), graph))

    // Data in the default graph (should be invisible through the named graph view)
    store.addQuad(DataFactory.quad(s, DataFactory.namedNode(Example.hasString), DataFactory.literal("default string")))

    return store
}

await describe("namedGraph with TermWrapper", async () => {
    await it("reads properties from the named graph via TermWrapper", () => {
        const view = namedGraph(graph, storeWithGraphData(), DataFactory)
        const parent = new Parent(DataFactory.namedNode("x"), view, DataFactory)

        assert.equal(parent.hasString, "graph string")
    })

    await it("does not see data from other graphs", () => {
        const view = namedGraph(graph, storeWithGraphData(), DataFactory)
        const parent = new Parent(DataFactory.namedNode("x"), view, DataFactory)

        // The value should be the one from the named graph, not the default graph
        assert.equal(parent.hasString, "graph string")
        assert.notEqual(parent.hasString, "default string")
    })

    await it("navigates child objects within the named graph", () => {
        const view = namedGraph(graph, storeWithGraphData(), DataFactory)
        const parent = new Parent(DataFactory.namedNode("x"), view, DataFactory)

        assert.equal(parent.hasChild.hasString, "graph child string")
    })

    await it("writes properties back into the named graph", () => {
        const store = storeWithGraphData()
        const view = namedGraph(graph, store, DataFactory)
        const parent = new Parent(DataFactory.namedNode("x"), view, DataFactory)

        parent.hasString = "updated"

        assert.equal(parent.hasString, "updated")
        // Verify the quad was written into the named graph of the underlying store
        assert.equal(store.has(DataFactory.quad(
            DataFactory.namedNode("x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("updated"),
            graph
        )), true)
    })

    await it("sets nullable properties through the named graph view", () => {
        const store = storeWithGraphData()
        const view = namedGraph(graph, store, DataFactory)
        const parent = new Parent(DataFactory.namedNode("x"), view, DataFactory)

        assert.equal(parent.hasNullableString, undefined)

        parent.hasNullableString = "now set"
        assert.equal(parent.hasNullableString, "now set")

        parent.hasNullableString = undefined
        assert.equal(parent.hasNullableString, undefined)
    })
})

await describe("namedGraph with DatasetWrapper", async () => {
    await it("finds instances within the named graph", () => {
        const view = namedGraph(graph, storeWithGraphData(), DataFactory)
        const parentDataset = new ParentDataset(view, DataFactory)

        const parents = Array.from(parentDataset.instancesOfParent)
        assert.equal(parents.length, 1)
        assert.equal(parents[0]!.hasString, "graph string")
    })

    await it("finds child objects via DatasetWrapper methods", () => {
        const view = namedGraph(graph, storeWithGraphData(), DataFactory)
        const parentDataset = new ParentDataset(view, DataFactory)

        const children = Array.from(parentDataset.objectsOfHasChild)
        assert.equal(children.length, 1)
        assert.equal(children[0]!.hasString, "graph child string")
    })

    await it("iterates only quads from the named graph", () => {
        const store = storeWithGraphData()
        const view = namedGraph(graph, store, DataFactory)
        const parentDataset = new ParentDataset(view, DataFactory)

        const quads = Array.from(parentDataset)
        // Named graph has 4 quads, default graph has 1 — should only see 4
        assert.equal(quads.length, 4)
        for (const quad of quads) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })
})
