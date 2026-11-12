import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { Parent } from "./model/Parent.js"
import { ParentDataset } from "./model/ParentDataset.js"
import { Example } from "./vocabulary/Example.js"
import { DatasetWrapper, NamedGraphDataset } from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const rdf = `
PREFIX : <https://example.org/>

<x> :hasString "default string" .

:graph {
    <x>
        a :Parent ;
        :hasString "graph string";
        :hasChild [
            :hasString "graph child string" ;
        ] ;
    .
}
`;

class SomeDataset extends DatasetWrapper {
    get namedGraph(): SomeNamedDataset {
        return this.named("https://example.org/graph", SomeNamedDataset)
    }
}

class SomeNamedDataset extends NamedGraphDataset {
    get parents(): Iterable<Parent> {
        return this.subjectsOf("https://example.org/hasString", Parent)
    }
}

await describe("namedGraph with TermWrapper", async () => {
    await it("reads properties from the named graph via TermWrapper", () => {
        const view = new SomeDataset(datasetFromRdf(rdf), DataFactory).namedGraph
        const parent = [...view.parents][0]!

        assert.equal(parent.hasString, "graph string")
    })

    await it("does not see data from other graphs", () => {
        const view = new SomeDataset(datasetFromRdf(rdf), DataFactory).namedGraph
        const parent = [...view.parents][0]!

        // The value should be the one from the named graph, not the default graph
        assert.equal(parent.hasString, "graph string")
        assert.notEqual(parent.hasString, "default string")
    })

    await it("navigates child objects within the named graph", () => {
        const view = new SomeDataset(datasetFromRdf(rdf), DataFactory).namedGraph
        const parent = [...view.parents][0]!

        assert.equal(parent.hasChild.hasString, "graph child string")
    })

    await it("writes properties back into the named graph", () => {
        const store = datasetFromRdf(rdf)
        const view = new SomeDataset(store, DataFactory).namedGraph
        const parent = [...view.parents][0]!

        parent.hasString = "updated"

        assert.equal(parent.hasString, "updated")
        // Verify the quad was written into the named graph of the underlying store
        assert.equal(store.has(DataFactory.quad(
            DataFactory.namedNode("x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("updated"),
            DataFactory.namedNode("https://example.org/graph"),
        )), true)
    })

    await it("sets nullable properties through the named graph view", () => {
        const store = datasetFromRdf(rdf)
        const view = new SomeDataset(store, DataFactory).namedGraph
        const parent = [...view.parents][0]!

        assert.equal(parent.hasNullableString, undefined)

        parent.hasNullableString = "now set"
        assert.equal(parent.hasNullableString, "now set")

        parent.hasNullableString = undefined
        assert.equal(parent.hasNullableString, undefined)
    })
})

await describe("namedGraph with DatasetWrapper", async () => {
    await it("finds instances within the named graph", () => {
        const view = new SomeDataset(datasetFromRdf(rdf), DataFactory).namedGraph
        const parentDataset = new ParentDataset(view, DataFactory)

        const parents = Array.from(parentDataset.instancesOfParent)
        assert.equal(parents.length, 1)
        assert.equal(parents[0]!.hasString, "graph string")
    })

    await it("iterates only quads from the named graph", () => {
        const view = new SomeDataset(datasetFromRdf(rdf), DataFactory).namedGraph

        const quads = Array.from(view)
        // Named graph has 4 quads, default graph has 1 — should only see 4
        assert.equal(quads.length, 4)
        for (const quad of quads) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })
})
