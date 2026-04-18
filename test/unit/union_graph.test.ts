import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import {
    DatasetWrapper,
    GraphScopedDataset,
    NamedGraphError,
    TermTypeError,
} from "@rdfjs/wrapper"
import { Parent } from "./model/Parent.js"
import { Example } from "./vocabulary/Example.js"

const graph = DataFactory.namedNode("https://example.org/graph")
const otherGraph = DataFactory.namedNode("https://example.org/other")
const s = DataFactory.namedNode("https://example.org/s")
const p = DataFactory.namedNode("https://example.org/p")
const oDefault = DataFactory.literal("default")
const oNamed = DataFactory.literal("named")
const oOther = DataFactory.literal("other")

function multiGraphStore(): Store {
    const store = new Store()
    store.addQuad(DataFactory.quad(s, p, oDefault))
    store.addQuad(DataFactory.quad(s, p, oNamed, graph))
    store.addQuad(DataFactory.quad(s, p, oOther, otherGraph))
    return store
}

class SomeDataset extends DatasetWrapper {
    get unionView(): GraphScopedDataset {
        return this.scoped(graph, undefined, GraphScopedDataset)
    }
}

await describe("GraphScopedDataset (union)", async () => {
    await it("iterates quads from all graphs projected to the default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        const quads = Array.from(view)

        assert.equal(quads.length, 3)
        for (const quad of quads) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
        const values = quads.map(q => q.object.value).sort()
        assert.deepEqual(values, ["default", "named", "other"])
    })

    await it("deduplicates triples that appear in multiple graphs", () => {
        const store = new Store()
        store.addQuad(DataFactory.quad(s, p, oDefault))
        store.addQuad(DataFactory.quad(s, p, oDefault, graph))
        store.addQuad(DataFactory.quad(s, p, oDefault, otherGraph))

        const view = new SomeDataset(store, DataFactory).unionView

        assert.equal(view.size, 1)
        assert.equal(Array.from(view).length, 1)
    })

    await it("size reflects unique triples across all graphs", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.equal(view.size, 3)
    })

    await it("has finds triples regardless of source graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.equal(view.has(DataFactory.quad(s, p, oDefault)), true)
        assert.equal(view.has(DataFactory.quad(s, p, oNamed)), true)
        assert.equal(view.has(DataFactory.quad(s, p, oOther)), true)
        assert.equal(view.has(DataFactory.quad(s, p, DataFactory.literal("missing"))), false)
    })

    await it("match returns a union view filtered by subject/predicate/object", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        const matched = Array.from(view.match(s, p))
        assert.equal(matched.length, 3)
        for (const quad of matched) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })

    await it("match accepts an explicit default graph argument", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        const matched = Array.from(view.match(undefined, undefined, undefined, DataFactory.defaultGraph()))
        assert.equal(matched.length, 3)
    })

    await it("add inserts into the configured named graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).unionView
        const newObject = DataFactory.literal("added")

        view.add(DataFactory.quad(s, p, newObject))

        assert.equal(store.has(DataFactory.quad(s, p, newObject, graph)), true)
        assert.equal(store.has(DataFactory.quad(s, p, newObject)), false)
        assert.equal(store.has(DataFactory.quad(s, p, newObject, otherGraph)), false)
    })

    await it("delete only removes from the configured named graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).unionView

        // The triple <s,p,"named"> exists only in `graph` so it should be removed.
        view.delete(DataFactory.quad(s, p, oNamed))
        assert.equal(store.has(DataFactory.quad(s, p, oNamed, graph)), false)

        // The triple <s,p,"default"> exists in the default graph and is left untouched.
        view.delete(DataFactory.quad(s, p, oDefault))
        assert.equal(store.has(DataFactory.quad(s, p, oDefault)), true)

        // The triple <s,p,"other"> exists in another named graph and is left untouched.
        view.delete(DataFactory.quad(s, p, oOther))
        assert.equal(store.has(DataFactory.quad(s, p, oOther, otherGraph)), true)
    })

    await it("throws NamedGraphError when adding a quad with a non-default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(
            () => view.add(DataFactory.quad(s, p, oDefault, otherGraph)),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when deleting a quad with a non-default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(
            () => view.delete(DataFactory.quad(s, p, oDefault, otherGraph)),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when checking has with a non-default graph quad", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(
            () => view.has(DataFactory.quad(s, p, oDefault, otherGraph)),
            NamedGraphError,
        )
    })

    await it("throws TermTypeError when matching with a non-default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(
            () => view.match(undefined, undefined, undefined, otherGraph),
            TermTypeError,
        )
    })
})

await describe("GraphScopedDataset (union) with TermWrapper", async () => {
    const subject = DataFactory.namedNode("https://example.org/x")

    function modelStore(): Store {
        const store = new Store()
        store.addQuad(DataFactory.quad(subject, DataFactory.namedNode(Example.hasString), DataFactory.literal("default value")))
        store.addQuad(DataFactory.quad(subject, DataFactory.namedNode(Example.hasNullableString), DataFactory.literal("from named"), graph))
        return store
    }

    class SomeUnionDataset extends GraphScopedDataset {
        get parent(): Parent {
            return new Parent(subject, this, this.factory)
        }
    }

    class Root extends DatasetWrapper {
        get union(): SomeUnionDataset {
            return this.scoped(graph, undefined, SomeUnionDataset)
        }
    }

    await it("reads properties from any graph through TermWrapper", () => {
        const root = new Root(modelStore(), DataFactory)
        const parent = root.union.parent

        assert.equal(parent.hasString, "default value")
        assert.equal(parent.hasNullableString, "from named")
    })

    await it("writes new properties into the configured named graph", () => {
        const store = modelStore()
        const root = new Root(store, DataFactory)
        const parent = root.union.parent

        parent.hasNullableString = "updated"

        // The new value is readable through the union view.
        assert.equal(root.union.parent.hasNullableString, "updated")
        // The replacement quad lives in the configured named graph.
        assert.equal(store.has(DataFactory.quad(
            subject,
            DataFactory.namedNode(Example.hasNullableString),
            DataFactory.literal("updated"),
            graph,
        )), true)
        // The original default-graph quad for hasString is unaffected.
        assert.equal(store.has(DataFactory.quad(
            subject,
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("default value"),
        )), true)
    })
})
