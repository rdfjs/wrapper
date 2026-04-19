import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store } from "n3"
import {
    NotifyingDatasetCoreWrapper,
    ensureNotifyingDatasetCore,
    LazyMatchNotifyingDatasetCore,
    EmptyDataset,
    defaultGraph,
} from "@rdfjs/wrapper"
import { n3StoreFactory } from "./util/n3StoreFactory.js"

const s = DataFactory.namedNode("https://example.org/s")
const s2 = DataFactory.namedNode("https://example.org/s2")
const p = DataFactory.namedNode("https://example.org/p")
const o1 = DataFactory.literal("o1")
const o2 = DataFactory.literal("o2")
const g = DataFactory.namedNode("https://example.org/g")

await describe("defaultGraph", async () => {
    await it("has the correct shape", () => {
        assert.equal(defaultGraph.termType, "DefaultGraph")
        assert.equal(defaultGraph.value, "")
    })

    await it("equals other default graphs", () => {
        assert.equal(defaultGraph.equals(DataFactory.defaultGraph()), true)
    })

    await it("does not equal a named node", () => {
        assert.equal(defaultGraph.equals(s), false)
    })

    await it("does not equal null/undefined", () => {
        assert.equal(defaultGraph.equals(null), false)
        assert.equal(defaultGraph.equals(undefined), false)
    })

    await it("is frozen", () => {
        assert.equal(Object.isFrozen(defaultGraph), true)
    })
})

await describe("NotifyingDatasetCoreWrapper", async () => {
    await it("emits add events", () => {
        const wrapped = new NotifyingDatasetCoreWrapper(new Store())
        const events: Array<string> = []
        wrapped.on(event => events.push(event))

        wrapped.add(DataFactory.quad(s, p, o1))

        assert.deepEqual(events, ["add"])
    })

    await it("emits delete events", () => {
        const inner = new Store()
        inner.addQuad(DataFactory.quad(s, p, o1))
        const wrapped = new NotifyingDatasetCoreWrapper(inner)
        const events: Array<string> = []
        wrapped.on(event => events.push(event))

        wrapped.delete(DataFactory.quad(s, p, o1))

        assert.deepEqual(events, ["delete"])
    })

    await it("does not emit when listener is detached", () => {
        const wrapped = new NotifyingDatasetCoreWrapper(new Store())
        const events: Array<string> = []
        const cb = (event: string) => { events.push(event) }
        wrapped.on(cb)
        wrapped.off(cb)

        wrapped.add(DataFactory.quad(s, p, o1))

        assert.deepEqual(events, [])
    })

    await it("delegates iterator to inner dataset", () => {
        const inner = new Store()
        inner.addQuad(DataFactory.quad(s, p, o1))
        inner.addQuad(DataFactory.quad(s, p, o2))
        const wrapped = new NotifyingDatasetCoreWrapper(inner)

        assert.equal(Array.from(wrapped).length, 2)
    })

    await it("delegates size", () => {
        const inner = new Store([DataFactory.quad(s, p, o1)])
        const wrapped = new NotifyingDatasetCoreWrapper(inner)

        assert.equal(wrapped.size, 1)
    })

    await it("match returns a NotifyingDatasetCore", () => {
        const inner = new Store([
            DataFactory.quad(s, p, o1),
            DataFactory.quad(s2, p, o1),
        ])
        const wrapped = new NotifyingDatasetCoreWrapper(inner)
        const matched = wrapped.match(s)

        assert.equal(matched.size, 1)
        assert.equal(typeof matched.on, "function")
    })
})

await describe("ensureNotifyingDatasetCore", async () => {
    await it("wraps a plain DatasetCore", () => {
        const inner = new Store()
        const wrapped = ensureNotifyingDatasetCore(inner)

        assert.ok(wrapped instanceof NotifyingDatasetCoreWrapper)
    })

    await it("returns a NotifyingDatasetCore unchanged", () => {
        const wrapped = new NotifyingDatasetCoreWrapper(new Store())
        const result = ensureNotifyingDatasetCore(wrapped)

        assert.equal(result, wrapped)
    })
})

await describe("LazyMatchNotifyingDatasetCore", async () => {
    function makeSource(): NotifyingDatasetCoreWrapper {
        const store = new Store([
            DataFactory.quad(s, p, o1),
            DataFactory.quad(s, p, o2),
            DataFactory.quad(s2, p, o1),
        ])
        return new NotifyingDatasetCoreWrapper(store)
    }

    await it("iterates matching source quads on first iteration", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            { subject: s },
            n3StoreFactory,
        )

        assert.equal(Array.from(lazy).length, 2)
    })

    await it("iterates from materialized cache on subsequent iteration", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            { subject: s },
            n3StoreFactory,
        )

        // Materialize via `size`.
        assert.equal(lazy.size, 2)
        // Subsequent iteration must yield the cached quads (not be empty).
        assert.equal(Array.from(lazy).length, 2)
    })

    await it("size triggers materialization and returns the count", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            {},
            n3StoreFactory,
        )

        assert.equal(lazy.size, 3)
    })

    await it("has uses source until materialized, then the cache", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            {},
            n3StoreFactory,
        )

        assert.equal(lazy.has(DataFactory.quad(s, p, o1)), true)
        // Materialize.
        assert.equal(lazy.size, 3)
        assert.equal(lazy.has(DataFactory.quad(s, p, o2)), true)
        assert.equal(lazy.has(DataFactory.quad(s2, p, o2)), false)
    })

    await it("add forwards to source and propagates into materialized cache", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            {},
            n3StoreFactory,
        )

        // Materialize first so the listener is wired.
        assert.equal(lazy.size, 3)

        lazy.add(DataFactory.quad(s2, p, o2))

        assert.equal(lazy.size, 4)
        assert.equal(source.has(DataFactory.quad(s2, p, o2)), true)
    })

    await it("delete forwards to source and propagates into materialized cache", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            {},
            n3StoreFactory,
        )

        assert.equal(lazy.size, 3)

        lazy.delete(DataFactory.quad(s, p, o1))

        assert.equal(lazy.size, 2)
        assert.equal(source.has(DataFactory.quad(s, p, o1)), false)
    })

    await it("match intersects pattern with view's pattern", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            { subject: s },
            n3StoreFactory,
        )

        const sub = lazy.match(undefined, p, o2)
        assert.equal(sub.size, 1)
    })

    await it("match returns EmptyDataset when patterns conflict", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            { subject: s },
            n3StoreFactory,
        )

        const sub = lazy.match(s2)
        assert.equal(sub.size, 0)
        assert.ok(sub instanceof EmptyDataset)
    })

    await it("on/off receives events filtered by pattern", () => {
        const source = makeSource()
        using lazy = new LazyMatchNotifyingDatasetCore(
            source,
            { subject: s },
            n3StoreFactory,
        )

        const events: Array<string> = []
        const cb = (event: string, q: any) => { events.push(`${event}:${q.object.value}`) }
        lazy.on(cb)

        // Matches the pattern (subject = s).
        source.add(DataFactory.quad(s, p, DataFactory.literal("new")))
        // Does not match the pattern (subject = s2).
        source.add(DataFactory.quad(s2, p, DataFactory.literal("ignored")))

        assert.deepEqual(events, ["add:new"])

        lazy.off(cb)
        source.add(DataFactory.quad(s, p, DataFactory.literal("after-off")))
        assert.deepEqual(events, ["add:new"])
    })

    await it("dispose detaches source listeners and is idempotent", () => {
        const source = makeSource()
        const lazy = new LazyMatchNotifyingDatasetCore(
            source,
            {},
            n3StoreFactory,
        )

        // Subscribe and materialize.
        const cb = () => { /* noop */ }
        lazy.on(cb)
        assert.equal(lazy.size, 3)

        lazy[Symbol.dispose]()
        // Calling dispose a second time should not throw.
        lazy[Symbol.dispose]()
    })
})

await describe("EmptyDataset", async () => {
    await it("has size 0", () => {
        const ds = new EmptyDataset()
        assert.equal(ds.size, 0)
    })

    await it("never has a quad", () => {
        const ds = new EmptyDataset()
        assert.equal(ds.has(), false)
    })

    await it("yields nothing on iteration", () => {
        const ds = new EmptyDataset()
        assert.equal(Array.from(ds).length, 0)
    })

    await it("returns itself on match", () => {
        const ds = new EmptyDataset()
        assert.equal(ds.match(), ds)
    })

    await it("throws on add", () => {
        const ds = new EmptyDataset()
        assert.throws(() => ds.add(), /empty/)
    })

    await it("throws on delete", () => {
        const ds = new EmptyDataset()
        assert.throws(() => ds.delete(), /empty/)
    })

    await it("on/off are no-ops", () => {
        const ds = new EmptyDataset()
        ds.on()
        ds.off()
    })
})
