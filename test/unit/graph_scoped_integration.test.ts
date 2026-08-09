import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { Parent } from "./model/Parent.js"
import { Example } from "./vocabulary/Example.js"
import { DatasetWrapper, GraphScopedDataset } from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const rdf = `
PREFIX : <https://example.org/>

<x> :hasString "default value" .

:graph {
    <x> :hasNullableString "from named" .
}
`;

const subject = DataFactory.namedNode("x")

class SomeUnionDataset extends GraphScopedDataset {
    get parent(): Parent {
        return new Parent(subject, this, this.factory)
    }

    get subjectsOfHasNullableString(): Iterable<Parent> {
        return this.subjectsOf(Example.hasNullableString, Parent)
    }
}

class Root extends DatasetWrapper {
    get union(): SomeUnionDataset {
        return this.scoped("https://example.org/graph", undefined, SomeUnionDataset)
    }
}

await describe("GraphScopedDataset with TermWrapper", async () => {
    await it("reads properties from any graph through TermWrapper", () => {
        const parent = new Root(datasetFromRdf(rdf), DataFactory).union.parent

        assert.equal(parent.hasString, "default value")
        assert.equal(parent.hasNullableString, "from named")
    })

    await it("finds subjects whose quads live in a named graph", () => {
        const union = new Root(datasetFromRdf(rdf), DataFactory).union
        const parents = Array.from(union.subjectsOfHasNullableString)

        assert.equal(parents.length, 1)
        assert.equal(parents[0]!.hasString, "default value")
    })

    await it("writes new properties into the configured write graph", () => {
        const store = datasetFromRdf(rdf)
        const root = new Root(store, DataFactory)

        root.union.parent.hasNullableString = "updated"

        // The new value is readable through the union view.
        assert.equal(root.union.parent.hasNullableString, "updated")
        // The replacement quad lives in the configured write graph.
        assert.equal(store.has(DataFactory.quad(
            subject,
            DataFactory.namedNode(Example.hasNullableString),
            DataFactory.literal("updated"),
            DataFactory.namedNode("https://example.org/graph"),
        )), true)
        // The original default-graph quad is unaffected.
        assert.equal(store.has(DataFactory.quad(
            subject,
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("default value"),
        )), true)
    })

    await it("clears optional properties through the union view", () => {
        const store = datasetFromRdf(rdf)
        const root = new Root(store, DataFactory)

        root.union.parent.hasNullableString = undefined

        assert.equal(root.union.parent.hasNullableString, undefined)
        assert.equal(store.has(DataFactory.quad(
            subject,
            DataFactory.namedNode(Example.hasNullableString),
            DataFactory.literal("from named"),
            DataFactory.namedNode("https://example.org/graph"),
        )), false)
    })
})
