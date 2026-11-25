import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store, type Quad } from "n3"
import { EventfulDatasetCore } from "@jeswr/eventful-dataset"
import { DatasetWrapper, GraphScopedDataset, type IDatasetChangeListener } from "@rdfjs/wrapper"

const g1 = DataFactory.namedNode("https://example.org/g1")
const g2 = DataFactory.namedNode("https://example.org/g2")
const g3 = DataFactory.namedNode("https://example.org/g3")
const s = DataFactory.namedNode("https://example.org/s")
const p = DataFactory.namedNode("https://example.org/p")
const o1 = DataFactory.literal("o1")
const o2 = DataFactory.literal("o2")

class SomeDataset extends DatasetWrapper {
    public get scopedView(): GraphScopedDataset {
        return this.scoped(g1, [g1, g2], GraphScopedDataset)
    }

    public get unionView(): GraphScopedDataset {
        return this.scoped(g1, undefined, GraphScopedDataset)
    }
}

function wrapperOf(...quads: Quad[]): SomeDataset {
    const store = new Store()
    for (const quad of quads) {
        store.addQuad(quad)
    }
    return new SomeDataset(store, DataFactory)
}

/**
 * Subscribes a recorder to a view's change notifications and returns the captured events plus a `stop` function that detaches the recorder.
 *
 * Events are recorded as `"<event>:<object value>"`; every received quad is asserted to be in the default graph, since notifications must be delivered projected.
 */
function recordEvents(view: GraphScopedDataset): { events: string[], stop: () => void } {
    const events: string[] = []
    const listener: IDatasetChangeListener = (event, quad) => {
        assert.equal(quad.graph.termType, "DefaultGraph")
        events.push(`${event}:${quad.object.value}`)
    }
    view.on(listener)
    return { events, stop: () => view.off(listener) }
}

await describe("GraphScopedDataset change notifications (explicit read graphs)", async () => {
    await it("emits an add event when a triple appears in a read graph", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, ["add:o1"])
    })

    await it("does not emit when a triple appears outside the read scope", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        wrapper.add(DataFactory.quad(s, p, o1, g3))
        wrapper.add(DataFactory.quad(s, p, o2))

        assert.deepEqual(events, [])
    })

    await it("reports a triple present in several read graphs as added only once", () => {
        const wrapper = wrapperOf(DataFactory.quad(s, p, o1, g1))
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        // The triple is already visible through g1; the copy in g2 does not change the projected view.
        wrapper.add(DataFactory.quad(s, p, o1, g2))

        assert.deepEqual(events, [])
    })

    await it("reports a delete only when the last copy disappears from the read scope", () => {
        const wrapper = wrapperOf(
            DataFactory.quad(s, p, o1, g1),
            DataFactory.quad(s, p, o1, g2),
        )
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        // The copy in g2 still backs the projected triple.
        wrapper.delete(DataFactory.quad(s, p, o1, g1))
        assert.deepEqual(events, [])

        // Removing the last copy changes the view.
        wrapper.delete(DataFactory.quad(s, p, o1, g2))
        assert.deepEqual(events, ["delete:o1"])
    })

    await it("does not report deleting a copy outside the read scope", () => {
        const wrapper = wrapperOf(
            DataFactory.quad(s, p, o1, g1),
            DataFactory.quad(s, p, o1, g3),
        )
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        wrapper.delete(DataFactory.quad(s, p, o1, g3))

        assert.deepEqual(events, [])
    })

    await it("notifies writes performed through the view itself", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        view.add(DataFactory.quad(s, p, o1))
        view.delete(DataFactory.quad(s, p, o1))

        assert.deepEqual(events, ["add:o1", "delete:o1"])
    })

    await it("stops emitting after off() detaches the listener", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const { events, stop } = recordEvents(view)

        stop()
        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, [])
    })

    await it("subscribing the same listener twice notifies it once", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const events: string[] = []
        const listener: IDatasetChangeListener = (event, quad) => {
            events.push(`${event}:${quad.object.value}`)
        }
        view.on(listener)
        view.on(listener)

        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, ["add:o1"])
    })

    await it("detaching a listener that is not subscribed is a no-op", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const { events } = recordEvents(view)

        view.off(() => { })
        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, ["add:o1"])
    })

    await it("supports multiple independent listeners", () => {
        const wrapper = wrapperOf()
        const view = wrapper.scopedView
        const first = recordEvents(view)
        const second = recordEvents(view)

        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(first.events, ["add:o1"])
        assert.deepEqual(second.events, ["add:o1"])
    })
})

await describe("GraphScopedDataset change notifications (union view)", async () => {
    await it("emits for triples appearing in any graph", () => {
        const wrapper = wrapperOf()
        const view = wrapper.unionView
        const { events } = recordEvents(view)

        wrapper.add(DataFactory.quad(s, p, o1))
        wrapper.add(DataFactory.quad(s, p, o2, g3))

        assert.deepEqual(events, ["add:o1", "add:o2"])
    })

    await it("reports a triple duplicated across graphs as added only once", () => {
        const wrapper = wrapperOf(DataFactory.quad(s, p, o1))
        const view = wrapper.unionView
        const { events } = recordEvents(view)

        // The triple already exists in the default graph; the copy in g1 does not change the union view.
        wrapper.add(DataFactory.quad(s, p, o1, g1))

        assert.deepEqual(events, [])
    })

    await it("reports a delete only when the last copy disappears", () => {
        const wrapper = wrapperOf(
            DataFactory.quad(s, p, o1),
            DataFactory.quad(s, p, o1, g1),
        )
        const view = wrapper.unionView
        const { events } = recordEvents(view)

        wrapper.delete(DataFactory.quad(s, p, o1))
        assert.deepEqual(events, [])

        wrapper.delete(DataFactory.quad(s, p, o1, g1))
        assert.deepEqual(events, ["delete:o1"])
    })
})

await describe("GraphScopedDataset change notifications (source subscription bookkeeping)", async () => {
    await it("attaches to the source lazily and detaches when the last listener leaves", () => {
        const core = new EventfulDatasetCore()
        const wrapper = new SomeDataset(core, DataFactory)
        const view = wrapper.scopedView

        assert.equal(core.listenerCount("add"), 0)
        assert.equal(core.listenerCount("delete"), 0)

        const first = recordEvents(view)
        const second = recordEvents(view)

        // A single source callback is shared by all of the view's listeners.
        assert.equal(core.listenerCount("add"), 1)
        assert.equal(core.listenerCount("delete"), 1)

        first.stop()
        assert.equal(core.listenerCount("add"), 1)

        second.stop()
        assert.equal(core.listenerCount("add"), 0)
        assert.equal(core.listenerCount("delete"), 0)
    })
})
