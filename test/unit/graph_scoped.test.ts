import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import { DatasetWrapper, GraphScopedDataset, NamedGraphError, TermTypeError } from "@rdfjs/wrapper"

const g1 = DataFactory.namedNode("https://example.org/g1")
const g2 = DataFactory.namedNode("https://example.org/g2")
const g3 = DataFactory.namedNode("https://example.org/g3")
const s = DataFactory.namedNode("https://example.org/s")
const p = DataFactory.namedNode("https://example.org/p")
const p2 = DataFactory.namedNode("https://example.org/p2")
const o1 = DataFactory.literal("o1")
const o2 = DataFactory.literal("o2")
const o3 = DataFactory.literal("o3")
const oDefault = DataFactory.literal("default")

function multiGraphStore(): Store {
    const store = new Store()
    store.addQuad(DataFactory.quad(s, p, oDefault))
    store.addQuad(DataFactory.quad(s, p, o1, g1))
    store.addQuad(DataFactory.quad(s, p, o2, g2))
    store.addQuad(DataFactory.quad(s, p, o3, g3))
    return store
}

class SomeDataset extends DatasetWrapper {
    get scopedView(): GraphScopedDataset {
        return this.scoped(g1, ["https://example.org/g1", g2], GraphScopedDataset)
    }

    get unionView(): GraphScopedDataset {
        return this.scoped(g1, undefined, GraphScopedDataset)
    }
}

await describe("GraphScopedDataset (explicit read graphs)", async () => {
    await it("iterates only quads in the configured read graphs projected to the default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView
        const quads = Array.from(view)

        assert.deepEqual(quads.map(quad => quad.object.value).sort(), ["o1", "o2"])
        for (const quad of quads) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })

    await it("deduplicates triples that appear in multiple read graphs", () => {
        const store = new Store()
        store.addQuad(DataFactory.quad(s, p, o1, g1))
        store.addQuad(DataFactory.quad(s, p, o1, g2))

        const view = new SomeDataset(store, DataFactory).scopedView

        assert.equal(view.size, 1)
        assert.equal(Array.from(view).length, 1)
    })

    await it("keeps literals that differ only in language or datatype", () => {
        const store = new Store()
        store.addQuad(DataFactory.quad(s, p, DataFactory.literal("chat", "en"), g1))
        store.addQuad(DataFactory.quad(s, p, DataFactory.literal("chat", "fr"), g2))

        const view = new SomeDataset(store, DataFactory).scopedView

        assert.equal(view.size, 2)
    })

    await it("deduplicates triples whose subject is a quoted triple", () => {
        const quoted = DataFactory.quad(s, p, o1)
        const store = new Store()
        store.addQuad(DataFactory.quad(quoted, p, o2, g1))
        store.addQuad(DataFactory.quad(quoted, p, o2, g2))

        const view = new SomeDataset(store, DataFactory).scopedView

        assert.equal(view.size, 1)
    })

    await it("size reflects distinct triples across the read graphs", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.equal(view.size, 2)
    })

    await it("has finds triples in any read graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.equal(view.has(DataFactory.quad(s, p, o1)), true)
        assert.equal(view.has(DataFactory.quad(s, p, o2)), true)
        assert.equal(view.has(DataFactory.quad(s, p, o3)), false)
        assert.equal(view.has(DataFactory.quad(s, p, oDefault)), false)
    })

    await it("add rewrites the graph to the configured write graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).scopedView
        const newObject = DataFactory.literal("added")

        view.add(DataFactory.quad(s, p, newObject))

        assert.equal(store.has(DataFactory.quad(s, p, newObject, g1)), true)
        assert.equal(store.has(DataFactory.quad(s, p, newObject)), false)
        assert.equal(store.has(DataFactory.quad(s, p, newObject, g2)), false)
    })

    await it("delete only removes from the configured write graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).scopedView

        // The triple <s,p,"o1"> exists in the write graph so it should be removed.
        view.delete(DataFactory.quad(s, p, o1))
        assert.equal(store.has(DataFactory.quad(s, p, o1, g1)), false)

        // The triple <s,p,"o2"> exists in another read graph and is left untouched.
        view.delete(DataFactory.quad(s, p, o2))
        assert.equal(store.has(DataFactory.quad(s, p, o2, g2)), true)
    })

    await it("match filters by subject/predicate/object across the read graphs", () => {
        const store = multiGraphStore()
        store.addQuad(DataFactory.quad(s, p2, DataFactory.literal("other"), g2))
        store.addQuad(DataFactory.quad(s, p2, DataFactory.literal("ignored"), g3))

        const view = new SomeDataset(store, DataFactory).scopedView
        const matched = Array.from(view.match(undefined, p2))

        assert.equal(matched.length, 1)
        assert.equal(matched[0]!.object.value, "other")
        assert.equal(matched[0]!.graph.termType, "DefaultGraph")
    })

    await it("match accepts an explicit DefaultGraph argument", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView
        const matched = Array.from(view.match(undefined, undefined, undefined, DataFactory.defaultGraph()))

        assert.equal(matched.length, 2)
    })

    await it("throws NamedGraphError when adding a quad with a named graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.throws(() => view.add(DataFactory.quad(s, p, o1, g3)), NamedGraphError)
    })

    await it("throws NamedGraphError when deleting a quad with a named graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.throws(() => view.delete(DataFactory.quad(s, p, o1, g3)), NamedGraphError)
    })

    await it("throws NamedGraphError when checking has with a named graph quad", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.throws(() => view.has(DataFactory.quad(s, p, o1, g3)), NamedGraphError)
    })

    await it("throws TermTypeError when matching with a non-default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).scopedView

        assert.throws(() => view.match(undefined, undefined, undefined, g3), TermTypeError)
    })
})

await describe("GraphScopedDataset (union)", async () => {
    await it("iterates quads from all graphs projected to the default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView
        const quads = Array.from(view)

        assert.deepEqual(quads.map(quad => quad.object.value).sort(), ["default", "o1", "o2", "o3"])
        for (const quad of quads) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })

    await it("deduplicates triples that appear in multiple graphs", () => {
        const store = new Store()
        store.addQuad(DataFactory.quad(s, p, o1))
        store.addQuad(DataFactory.quad(s, p, o1, g1))
        store.addQuad(DataFactory.quad(s, p, o1, g2))

        const view = new SomeDataset(store, DataFactory).unionView

        assert.equal(view.size, 1)
        assert.equal(Array.from(view).length, 1)
    })

    await it("size reflects unique triples across all graphs", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.equal(view.size, 4)
    })

    await it("has finds triples regardless of source graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.equal(view.has(DataFactory.quad(s, p, oDefault)), true)
        assert.equal(view.has(DataFactory.quad(s, p, o1)), true)
        assert.equal(view.has(DataFactory.quad(s, p, o3)), true)
        assert.equal(view.has(DataFactory.quad(s, p, DataFactory.literal("missing"))), false)
    })

    await it("match returns a union view filtered by subject/predicate/object", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView
        const matched = Array.from(view.match(s, p))

        assert.equal(matched.length, 4)
        for (const quad of matched) {
            assert.equal(quad.graph.termType, "DefaultGraph")
        }
    })

    await it("match accepts an explicit DefaultGraph argument", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView
        const matched = Array.from(view.match(undefined, undefined, undefined, DataFactory.defaultGraph()))

        assert.equal(matched.length, 4)
    })

    await it("add inserts into the configured write graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).unionView
        const newObject = DataFactory.literal("added")

        view.add(DataFactory.quad(s, p, newObject))

        assert.equal(store.has(DataFactory.quad(s, p, newObject, g1)), true)
        assert.equal(store.has(DataFactory.quad(s, p, newObject)), false)
    })

    await it("delete only removes from the configured write graph", () => {
        const store = multiGraphStore()
        const view = new SomeDataset(store, DataFactory).unionView

        // The triple <s,p,"o1"> exists in the write graph so it should be removed.
        view.delete(DataFactory.quad(s, p, o1))
        assert.equal(store.has(DataFactory.quad(s, p, o1, g1)), false)

        // The triple <s,p,"default"> exists in the default graph and is left untouched.
        view.delete(DataFactory.quad(s, p, oDefault))
        assert.equal(store.has(DataFactory.quad(s, p, oDefault)), true)

        // The triple <s,p,"o3"> exists in another named graph and is left untouched.
        view.delete(DataFactory.quad(s, p, o3))
        assert.equal(store.has(DataFactory.quad(s, p, o3, g3)), true)
    })

    await it("throws NamedGraphError when adding a quad with a named graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(() => view.add(DataFactory.quad(s, p, o1, g3)), NamedGraphError)
    })

    await it("throws TermTypeError when matching with a non-default graph", () => {
        const view = new SomeDataset(multiGraphStore(), DataFactory).unionView

        assert.throws(() => view.match(undefined, undefined, undefined, g3), TermTypeError)
    })
})
