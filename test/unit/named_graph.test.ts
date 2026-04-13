import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import { namedGraph, NamedGraphError, TermTypeError } from "@rdfjs/wrapper"

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

await describe("namedGraph", async () => {
    await it("exposes quads from the named graph as default graph quads", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)
        const quads = Array.from(ds)

        assert.equal(quads.length, 1)
        assert.equal(quads[0]!.subject.value, s.value)
        assert.equal(quads[0]!.predicate.value, p.value)
        assert.equal(quads[0]!.object.value, "value")
        assert.equal(quads[0]!.graph.termType, "DefaultGraph")
    })

    await it("reports correct size", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)
        assert.equal(ds.size, 1)
    })

    await it("has returns true for a matching default graph quad", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)
        assert.equal(ds.has(DataFactory.quad(s, p, o)), true)
    })

    await it("has returns false for a non-matching quad", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)
        assert.equal(ds.has(DataFactory.quad(s, p, DataFactory.literal("nope"))), false)
    })

    await it("add inserts into the named graph of the underlying dataset", () => {
        const store = storeWithNamedGraph()
        const ds = namedGraph(graph, store, DataFactory)
        const newObj = DataFactory.literal("new")

        ds.add(DataFactory.quad(s, p, newObj))

        assert.equal(ds.size, 2)
        assert.equal(store.has(DataFactory.quad(s, p, newObj, graph)), true)
    })

    await it("delete removes from the named graph of the underlying dataset", () => {
        const store = storeWithNamedGraph()
        const ds = namedGraph(graph, store, DataFactory)

        ds.delete(DataFactory.quad(s, p, o))

        assert.equal(ds.size, 0)
        assert.equal(store.has(DataFactory.quad(s, p, o, graph)), false)
    })

    await it("match filters by subject/predicate/object within the named graph", () => {
        const store = new Store()
        const p2 = DataFactory.namedNode("https://example.org/p2")
        store.addQuad(DataFactory.quad(s, p, o, graph))
        store.addQuad(DataFactory.quad(s, p2, DataFactory.literal("other"), graph))

        const ds = namedGraph(graph, store, DataFactory)
        const matched = Array.from(ds.match(undefined, p2))

        assert.equal(matched.length, 1)
        assert.equal(matched[0]!.predicate.value, p2.value)
        assert.equal(matched[0]!.graph.termType, "DefaultGraph")
    })

    await it("match with DefaultGraph argument works", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)
        const matched = Array.from(ds.match(undefined, undefined, undefined, DataFactory.defaultGraph()))

        assert.equal(matched.length, 1)
    })

    await it("throws NamedGraphError when adding a quad with a named graph", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)

        assert.throws(
            () => ds.add(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when deleting a quad with a named graph", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)

        assert.throws(
            () => ds.delete(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws NamedGraphError when checking has with a named graph quad", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)

        assert.throws(
            () => ds.has(DataFactory.quad(s, p, o, DataFactory.namedNode("https://other.org/g"))),
            NamedGraphError,
        )
    })

    await it("throws TermTypeError when matching with a non-default graph", () => {
        const ds = namedGraph(graph, storeWithNamedGraph(), DataFactory)

        assert.throws(
            () => ds.match(undefined, undefined, undefined, DataFactory.namedNode("https://other.org/g")),
            TermTypeError,
        )
    })
})
