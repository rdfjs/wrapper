import assert from "node:assert"
import { describe, it } from "node:test"
import type { Quad } from "@rdfjs/types"
import { DataFactory } from "n3"
import type { IAsyncDatasetChangeListener } from "@rdfjs/wrapper"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"
import { AsyncParentDataset } from "./model/AsyncParentDataset.js"
import { AsyncParent } from "./model/AsyncParent.js"
import { AsyncChild } from "./model/AsyncChild.js"
import { Example } from "./vocabulary/Example.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasNumber "1.0E0"^^<http://www.w3.org/2001/XMLSchema#double> ;
    :hasString "o1" ;
    :hasChild [ :hasString "child string 1" ] ;
    :hasChildSet [ :hasString "set 1" ], [ :hasString "set 2" ] ;
    :hasNullableString "nullable" ;
.
`;

/**
 * Subscribes a recorder to an {@link AsyncParentDataset}'s change notifications and returns the captured events plus a `stop` function that detaches the recorder.
 *
 * Events are recorded as `"<event>:<predicate>:<object value>"` so the tests can assert exactly which quads were added or removed without caring about subjects (which are stable for a given anchor).
 */
function recordEvents(ds: AsyncParentDataset): { events: string[], stop: () => void } {
    const events: string[] = []
    const listener: IAsyncDatasetChangeListener = (event, q) => {
        events.push(`${event}:${q.predicate.value.replace("https://example.org/", "")}:${q.object.value}`)
    }
    ds.on(listener)
    return { events, stop: () => ds.off(listener) }
}

function quadOf(subject: string, predicate: string, object: string): Quad {
    return DataFactory.quad(
        DataFactory.namedNode(subject),
        DataFactory.namedNode(predicate),
        DataFactory.literal(object),
    )
}

await describe("AsyncDatasetWrapper change notifications", async () => {
    await it("emits an add event when a quad is added directly", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const { events, stop } = recordEvents(ds)

        await ds.add(quadOf("https://example.org/x", Example.hasString, "added"))

        assert.deepEqual(events, ["add:hasString:added"])
        stop()
    })

    await it("emits a delete event when a quad is removed directly", async () => {
        // The fixture's `<x>` is a relative IRI, so the parsed subject is plain "x".
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(rdf), DataFactory)
        const { events, stop } = recordEvents(ds)

        await ds.delete(quadOf("x", Example.hasString, "o1"))

        assert.deepEqual(events, ["delete:hasString:o1"])
        stop()
    })

    await it("does not emit when adding a quad the dataset already contains", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(rdf), DataFactory)
        const { events, stop } = recordEvents(ds)

        await ds.add(quadOf("x", Example.hasString, "o1"))

        assert.deepEqual(events, [])
        stop()
    })

    await it("does not emit when deleting a quad the dataset does not contain", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(rdf), DataFactory)
        const { events, stop } = recordEvents(ds)

        await ds.delete(quadOf("https://example.org/x", Example.hasString, "absent"))

        assert.deepEqual(events, [])
        stop()
    })

    await it("stops emitting after off() detaches the listener", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const { events, stop } = recordEvents(ds)

        stop()
        await ds.add(quadOf("https://example.org/x", Example.hasString, "ignored"))

        assert.deepEqual(events, [])
    })

    await it("detaching a listener that is not subscribed is a no-op", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const { events, stop } = recordEvents(ds)

        ds.off(() => { })
        await ds.add(quadOf("https://example.org/x", Example.hasString, "observed"))

        assert.deepEqual(events, ["add:hasString:observed"])
        stop()
    })

    await it("supports multiple independent listeners", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const a: string[] = []
        const b: string[] = []
        ds.on(event => { a.push(event) })
        ds.on(event => { b.push(event) })

        await ds.add(quadOf("https://example.org/x", Example.hasString, "v"))

        assert.deepEqual(a, ["add"])
        assert.deepEqual(b, ["add"])
    })

    await it("subscribing the same listener twice notifies it once", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const events: string[] = []
        const listener: IAsyncDatasetChangeListener = event => { events.push(event) }
        ds.on(listener)
        ds.on(listener)

        await ds.add(quadOf("https://example.org/x", Example.hasString, "v"))

        assert.deepEqual(events, ["add"])
        ds.off(listener)
        await ds.add(quadOf("https://example.org/x", Example.hasString, "w"))
        assert.deepEqual(events, ["add"])
    })

    await it("awaits an asynchronous listener before the mutation resolves", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const events: string[] = []
        ds.on(async event => {
            await new Promise(resolve => setTimeout(resolve, 5))
            events.push(event)
        })

        await ds.add(quadOf("https://example.org/x", Example.hasString, "v"))

        assert.deepEqual(events, ["add"])
    })

    await it("awaits each asynchronous listener before invoking the next", async () => {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(""), DataFactory)
        const order: string[] = []
        ds.on(async () => {
            order.push("first:start")
            await new Promise(resolve => setTimeout(resolve, 5))
            order.push("first:end")
        })
        ds.on(() => { order.push("second") })

        await ds.add(quadOf("https://example.org/x", Example.hasString, "v"))

        assert.deepEqual(order, ["first:start", "first:end", "second"])
    })

    await it("does not notify mutations performed directly on the wrapped dataset", async () => {
        const wrapped = asyncDatasetFromRdf("")
        const ds = new AsyncParentDataset(wrapped, DataFactory)
        const { events, stop } = recordEvents(ds)

        await wrapped.add(quadOf("https://example.org/x", Example.hasString, "unobserved"))

        assert.deepEqual(events, [])
        assert.equal(await ds.size, 1)
        stop()
    })
})

await describe("Wrapper-driven asynchronous change notifications", async () => {
    /** Returns the singleton `<x>` parent in the test fixture. */
    async function load(): Promise<{ ds: AsyncParentDataset, parent: AsyncParent }> {
        const ds = new AsyncParentDataset(asyncDatasetFromRdf(rdf), DataFactory)

        for await (const parent of ds.instancesOfParent) {
            return { ds, parent }
        }

        throw new Error("fixture contains no parent")
    }

    await it("setting a required property to a new value emits delete then add", async () => {
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        await parent.setHasString("o2")

        assert.deepEqual(events, ["delete:hasString:o1", "add:hasString:o2"])
        stop()
    })

    await it("setting a required property to its current value still emits both events", async () => {
        // AsyncOptionalAs.object always deletes existing matching quads before adding the new one, so a "no-op" assignment surfaces as two effective mutations.
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        await parent.setHasString("o1")

        assert.deepEqual(events, ["delete:hasString:o1", "add:hasString:o1"])
        stop()
    })

    await it("clearing an optional property emits only a delete", async () => {
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        await parent.setHasNullableString(undefined)

        assert.deepEqual(events, ["delete:hasNullableString:nullable"])
        stop()
    })

    await it("clearing an already-empty optional property emits nothing", async () => {
        const { ds, parent } = await load()
        await parent.setHasNullableString(undefined)
        const { events, stop } = recordEvents(ds)

        await parent.setHasNullableString(undefined)

        assert.deepEqual(events, [])
        stop()
    })

    await it("setting an optional property from undefined emits only an add", async () => {
        const { ds, parent } = await load()
        await parent.setHasNullableString(undefined)
        const { events, stop } = recordEvents(ds)

        await parent.setHasNullableString("first")

        assert.deepEqual(events, ["add:hasNullableString:first"])
        stop()
    })

    await it("changing a typed (number) property emits delete + add for the typed literal", async () => {
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        await parent.setHasNumber(2)

        assert.deepEqual(events, [
            "delete:hasNumber:1.0E0",
            "add:hasNumber:2",
        ])
        stop()
    })

    await it("adding to a Set-mapped property emits a single add", async () => {
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        const newChild = new AsyncChild(DataFactory.namedNode("https://example.org/new-child"), ds, DataFactory)
        await parent.hasChildSet.add(newChild)

        assert.deepEqual(events, ["add:hasChildSet:https://example.org/new-child"])
        stop()
    })

    await it("removing from a Set-mapped property emits a single delete", async () => {
        const { ds, parent } = await load()
        let first: AsyncChild | undefined

        for await (const child of parent.hasChildSet) {
            first = child
            break
        }

        const { events, stop } = recordEvents(ds)

        await parent.hasChildSet.delete(first!)

        assert.deepEqual(events, [`delete:hasChildSet:${first!.value}`])
        stop()
    })

    await it("removing a value not in the Set is a no-op and emits nothing", async () => {
        const { ds, parent } = await load()
        const { events, stop } = recordEvents(ds)

        const stranger = new AsyncChild(DataFactory.namedNode("https://example.org/stranger"), ds, DataFactory)
        await parent.hasChildSet.delete(stranger)

        assert.deepEqual(events, [])
        stop()
    })

    await it("clearing a Set-mapped property emits a delete per remaining item", async () => {
        const { ds, parent } = await load()
        const childIris: string[] = []

        for await (const child of parent.hasChildSet) {
            childIris.push(child.value)
        }

        const { events, stop } = recordEvents(ds)

        await parent.hasChildSet.clear()

        assert.deepEqual(
            events.sort(),
            childIris.map(iri => `delete:hasChildSet:${iri}`).sort(),
        )
        stop()
    })
})
