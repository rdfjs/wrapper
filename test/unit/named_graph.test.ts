import assert from "node:assert"
import { describe, it } from "node:test"
import { Triple as N3Triple, DataFactory, Store } from "n3"
import { DatasetWrapper, defaultGraph, GraphScopedDataset, NamedGraphError, TermTypeError, Triple } from "@rdfjs/wrapper"
import type { DataFactory as IDataFactory, DatasetCore } from "@rdfjs/types"
import { n3StoreFactory } from "./util/n3StoreFactory.js"
const factory = DataFactory as unknown as IDataFactory<Triple, Triple>
const asTripleStore = (store: Store) => store as unknown as DatasetCore<Triple, Triple>
const graph = DataFactory.namedNode("https://example.org/graph")
const s = DataFactory.namedNode("https://example.org/s")
const p = DataFactory.namedNode("https://example.org/p")
const o = DataFactory.literal("value")

function storeWithNamedGraph(): Store {
    const store = new Store()
    store.addQuad(DataFactory.quad(s, p, o, graph))
    store.addQuad(DataFactory.quad(s, p, DataFactory.literal("default")))
    return store
}

class SomeDataset extends DatasetWrapper {
    get namedGraph(): GraphScopedDataset {
        return this.scoped(graph, [graph], GraphScopedDataset)
    }
}

await describe("namedGraph", async () => {
    await it("exposes quads from the named graph as default graph quads", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph
        const quads = Array.from(ds)

        assert.equal(quads.length, 1)
        assert.equal(quads[0]!.subject.value, s.value)
        assert.equal(quads[0]!.predicate.value, p.value)
        assert.equal(quads[0]!.object.value, "value")
        assert.equal(quads[0]!.graph.termType, "DefaultGraph")
    })

    await it("reports correct size", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph
        assert.equal(ds.size, 1)
    })

    await it("has returns true for a matching default graph quad", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph
        assert.equal(ds.has(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o)), true)
    })

    await it("has returns false for a non-matching quad", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph
        assert.equal(ds.has(DataFactory.quad<Triple, N3Triple & Triple>(s, p, DataFactory.literal("nope"))), false)
    })

    await it("add inserts into the named graph of the underlying dataset", () => {
        const store = storeWithNamedGraph()
        const ds = new SomeDataset(asTripleStore(store), factory, n3StoreFactory).namedGraph
        const newObj = DataFactory.literal("new")

        ds.add(DataFactory.quad<Triple, N3Triple & Triple>(s, p, newObj))

        assert.equal(ds.size, 2)
        assert.equal(store.has(DataFactory.quad(s, p, newObj, graph)), true)
    })

    await it("delete removes from the named graph of the underlying dataset", () => {
        const store = storeWithNamedGraph()
        const ds = new SomeDataset(asTripleStore(store), factory, n3StoreFactory).namedGraph

        ds.delete(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o))

        assert.equal(ds.size, 0)
        assert.equal(store.has(DataFactory.quad(s, p, o, graph)), false)
    })

    await it("match filters by subject/predicate/object within the named graph", () => {
        const store = new Store()
        const p2 = DataFactory.namedNode("https://example.org/p2")
        store.addQuad(DataFactory.quad(s, p, o, graph))
        store.addQuad(DataFactory.quad(s, p2, DataFactory.literal("other"), graph))

        const ds = new SomeDataset(asTripleStore(store), factory, n3StoreFactory).namedGraph
        const matched = Array.from(ds.match(undefined, p2, undefined, defaultGraph))

        assert.equal(matched.length, 1)
        assert.equal(matched[0]!.predicate.value, p2.value)
        assert.equal(matched[0]!.graph.termType, "DefaultGraph")
    })

    await it("match with DefaultGraph argument works", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph
        const matched = Array.from(ds.match(undefined, undefined, undefined, DataFactory.defaultGraph()))

        assert.equal(matched.length, 1)
    })

    await it("throws NamedGraphError when adding a quad with a named graph", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph

        assert.throws(
            // @ts-expect-error
            () => ds.add(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when deleting a quad with a named graph", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph

        assert.throws(
            // @ts-expect-error
            () => ds.delete(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when checking has with a named graph quad", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph

        assert.throws(
            // @ts-expect-error
            () => ds.has(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws TermTypeError when matching with a non-default graph", () => {
        const ds = new SomeDataset(asTripleStore(storeWithNamedGraph()), factory, n3StoreFactory).namedGraph

        assert.throws(
            () => ds.match(undefined, undefined, undefined, DataFactory.namedNode("https://other.org/g") as any),
            TermTypeError,
        )
    })
})
