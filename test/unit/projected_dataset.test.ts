import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store, Triple as N3Triple } from "n3"
import {
    NotifyingDatasetCoreWrapper,
    ProjectedDatasetCoreWrapper,
    TermTypeError,
    NamedGraphError,
    type Triple,
} from "@rdfjs/wrapper"
import { n3StoreFactory } from "./util/n3StoreFactory.js"

const s = DataFactory.namedNode("https://example.org/s")
const p = DataFactory.namedNode("https://example.org/p")
const o1 = DataFactory.literal("o1")
const o2 = DataFactory.literal("o2")
const g1 = DataFactory.namedNode("https://example.org/g1")
const g2 = DataFactory.namedNode("https://example.org/g2")
const g3 = DataFactory.namedNode("https://example.org/g3")

const factory: any = n3StoreFactory

function source(quads: ReadonlyArray<ReturnType<typeof DataFactory.quad>> = []): NotifyingDatasetCoreWrapper {
    const store = new Store()
    for (const q of quads) store.addQuad(q as any)
    return new NotifyingDatasetCoreWrapper(store)
}

function captureEvents(view: ProjectedDatasetCoreWrapper): Array<string> {
    const events: Array<string> = []
    view.on((event, q) => events.push(`${event}:${q.object.value}`))
    return events
}

await describe("ProjectedDatasetCoreWrapper - explicit read graphs", async () => {
    await it("iterates only quads in the configured read graphs", () => {
        const src = source([
            DataFactory.quad(s, p, o1, g1),
            DataFactory.quad(s, p, o2, g2),
            DataFactory.quad(s, p, DataFactory.literal("ignored"), g3),
        ])

        const view = new ProjectedDatasetCoreWrapper(g1, [g1, g2], src, DataFactory, factory)
        const values = Array.from(view).map(q => q.object.value).sort()

        assert.deepEqual(values, ["o1", "o2"])
    })

    await it("write rewrites the graph to the configured write graph", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)

        view.add(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o1))

        assert.equal(src.has(DataFactory.quad(s, p, o1, g1)), true)
    })

    await it("rejects writes whose quad is not in the default graph", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)

        // @ts-expect-error
        assert.throws(() => view.add(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o1, g2)), NamedGraphError)
        // @ts-expect-error
        assert.throws(() => view.delete(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o1, g2)), NamedGraphError)
        // @ts-expect-error
        assert.throws(() => view.has(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o1, g2)), NamedGraphError)
    })

    await it("match throws TermTypeError on a non-default graph argument", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)

        assert.throws(() => view.match(undefined, undefined, undefined, g1 as any), TermTypeError)
    })

    await it("match accepts an explicit DefaultGraph argument", () => {
        const src = source([DataFactory.quad(s, p, o1, g1)])
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)

        assert.equal(view.match(undefined, undefined, undefined, DataFactory.defaultGraph()).size, 1)
    })

    await it("emits add events for triples added to a read graph", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1, g2], src, DataFactory, factory)
        const events = captureEvents(view)

        src.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, ["add:o1"])
    })

    await it("does not emit for triples added to a graph outside read scope", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)
        const events = captureEvents(view)

        src.add(DataFactory.quad(s, p, o1, g2))

        assert.deepEqual(events, [])
    })

    await it("suppresses duplicate add events when a triple already exists in another read graph", () => {
        const src = source([DataFactory.quad(s, p, o1, g1)])
        const view = new ProjectedDatasetCoreWrapper(g1, [g1, g2], src, DataFactory, factory)
        const events = captureEvents(view)

        // Triple already in g1; adding the same triple to g2 must not duplicate the projected view.
        src.add(DataFactory.quad(s, p, o1, g2))

        assert.deepEqual(events, [])
    })

    await it("suppresses delete events while another read graph still has the triple", () => {
        const src = source([
            DataFactory.quad(s, p, o1, g1),
            DataFactory.quad(s, p, o1, g2),
        ])
        const view = new ProjectedDatasetCoreWrapper(g1, [g1, g2], src, DataFactory, factory)
        const events = captureEvents(view)

        // Removing the copy in g1 must not surface as a delete because g2 still has it.
        src.delete(DataFactory.quad(s, p, o1, g1))
        // Removing the last copy must surface as a delete.
        src.delete(DataFactory.quad(s, p, o1, g2))

        assert.deepEqual(events, ["delete:o1"])
    })

    await it("off detaches the source listener when no view listeners remain", () => {
        const src = source()
        const view = new ProjectedDatasetCoreWrapper(g1, [g1], src, DataFactory, factory)
        const events: Array<string> = []
        const cb = (event: string, q: any) => { events.push(`${event}:${q.object.value}`) }

        view.on(cb)
        view.off(cb)

        src.add(DataFactory.quad(s, p, o1, g1))
        assert.deepEqual(events, [])
    })
})

await describe("ProjectedDatasetCoreWrapper - union (readGraphs undefined)", async () => {
    await it("iterates triples from any graph deduplicated", () => {
        const src = source([
            DataFactory.quad(s, p, o1),
            DataFactory.quad(s, p, o1, g1),
            DataFactory.quad(s, p, o2, g2),
        ])
        const view = new ProjectedDatasetCoreWrapper(g1, undefined, src, DataFactory, factory)

        assert.equal(view.size, 2)
    })

    await it("has finds triples in any graph", () => {
        const src = source([DataFactory.quad(s, p, o1, g3)])
        const view = new ProjectedDatasetCoreWrapper(g1, undefined, src, DataFactory, factory)

        assert.equal(view.has(DataFactory.quad<Triple, N3Triple & Triple>(s, p, o1)), true)
    })

    await it("emits a single add event when a duplicate already exists in another graph", () => {
        const src = source([DataFactory.quad(s, p, o1)])
        const view = new ProjectedDatasetCoreWrapper(g1, undefined, src, DataFactory, factory)
        const events = captureEvents(view)

        // The triple already exists in the default graph; adding it to g1 must not re-emit.
        src.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, [])
    })

    await it("emits a delete event only when the last copy is removed", () => {
        const src = source([
            DataFactory.quad(s, p, o1),
            DataFactory.quad(s, p, o1, g1),
        ])
        const view = new ProjectedDatasetCoreWrapper(g1, undefined, src, DataFactory, factory)
        const events = captureEvents(view)

        src.delete(DataFactory.quad(s, p, o1))
        src.delete(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, ["delete:o1"])
    })
})
