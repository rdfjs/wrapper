import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Triple as N3Triple } from "n3"
import {
    type ChangeEvent,
    type Triple,
} from "@rdfjs/wrapper"
import { dataFactory } from "./util/dataFactory.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { n3StoreFactory } from "./util/n3StoreFactory.js"
import { ParentDataset } from "./model/ParentDataset.js"
import { Parent } from "./model/Parent.js"
import { Child } from "./model/Child.js"
import { Example } from "./vocabulary/Example.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasBlankNode "blankNodeIri" ;
    :hasDate "2024-01-01T00:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    :hasLangString "hello"@en ;
    :hasNumber "1.0E0"^^<http://www.w3.org/2001/XMLSchema#double> ;
    :hasBoolean "true"^^<http://www.w3.org/2001/XMLSchema#boolean> ;
    :hasString "o1" ;
    :hasIri <http://example.org/iri> ;
    :hasChild [ :hasString "child string 1" ] ;
    :hasChildSet [ :hasString "set 1" ], [ :hasString "set 2" ] ;
    :hasNullableString "nullable" ;
.
`;

/**
 * Subscribes a recorder to a {@link ParentDataset}'s change stream and
 * returns the captured events plus a `stop` function.
 *
 * Events are recorded as `"<event>:<predicate>:<object value>"` so the
 * tests can assert exactly which quads were added or removed without
 * caring about subjects (which are stable for a given anchor).
 */
function recordEvents(ds: ParentDataset): { events: string[], stop: () => void } {
    const events: string[] = []
    const listener = (event: ChangeEvent, q: Triple) => {
        events.push(`${event}:${q.predicate.value.replace("https://example.org/", "")}:${q.object.value}`)
    }
    ds.on(listener)
    return { events, stop: () => ds.off(listener) }
}

await describe("DatasetWrapper change notifications", async () => {
    await it("emits an add event when a quad is added directly", () => {
        const ds = new ParentDataset(datasetFromRdf(""), dataFactory, n3StoreFactory)
        const { events, stop } = recordEvents(ds)

        ds.add(DataFactory.quad<Triple, N3Triple & Triple>(
            DataFactory.namedNode("https://example.org/x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("added"),
        ))

        assert.deepEqual(events, ["add:hasString:added"])
        stop()
    })

    await it("emits a delete event when a quad is removed directly", () => {
        const ds = new ParentDataset(datasetFromRdf(rdf), dataFactory, n3StoreFactory)
        const { events, stop } = recordEvents(ds)

        ds.delete(DataFactory.quad<Triple, N3Triple & Triple>(
            DataFactory.namedNode("https://example.org/x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("o1"),
        ))

        assert.deepEqual(events, ["delete:hasString:o1"])
        stop()
    })

    await it("stops emitting after off() detaches the listener", () => {
        const ds = new ParentDataset(datasetFromRdf(""), dataFactory, n3StoreFactory)
        const { events, stop } = recordEvents(ds)

        stop()
        ds.add(DataFactory.quad<Triple, N3Triple & Triple>(
            DataFactory.namedNode("https://example.org/x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("ignored"),
        ))

        assert.deepEqual(events, [])
    })

    await it("supports multiple independent listeners", () => {
        const ds = new ParentDataset(datasetFromRdf(""), dataFactory, n3StoreFactory)
        const a: ChangeEvent[] = []
        const b: ChangeEvent[] = []
        ds.on(event => a.push(event))
        ds.on(event => b.push(event))

        ds.add(DataFactory.quad<Triple, N3Triple & Triple>(
            DataFactory.namedNode("https://example.org/x"),
            DataFactory.namedNode(Example.hasString),
            DataFactory.literal("v"),
        ))

        assert.deepEqual(a, ["add"])
        assert.deepEqual(b, ["add"])
    })
})

await describe("Wrapper-driven change notifications", async () => {
    /** Returns the singleton `<x>` parent in the test fixture. */
    function load(): { ds: ParentDataset, parent: Parent } {
        const ds = new ParentDataset(datasetFromRdf(rdf), dataFactory, n3StoreFactory)
        const [parent] = Array.from(ds.instancesOfParent)
        return { ds, parent: parent! }
    }

    await it("setting a required property to a new value emits delete then add", () => {
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        parent.hasString = "o2"

        assert.deepEqual(events, ["delete:hasString:o1", "add:hasString:o2"])
        stop()
    })

    await it("setting a required property to its current value still emits both events", () => {
        // OptionalAs.object always deletes existing matching quads before
        // adding the new one, so a "no-op" assignment surfaces as two events.
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        parent.hasString = "o1"

        assert.deepEqual(events, ["delete:hasString:o1", "add:hasString:o1"])
        stop()
    })

    await it("clearing an optional property emits only a delete", () => {
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        parent.hasNullableString = undefined

        assert.deepEqual(events, ["delete:hasNullableString:nullable"])
        stop()
    })

    await it("setting an optional property from undefined emits only an add", () => {
        const { ds, parent } = load()
        parent.hasNullableString = undefined
        const { events, stop } = recordEvents(ds)

        parent.hasNullableString = "first"

        assert.deepEqual(events, ["add:hasNullableString:first"])
        stop()
    })

    await it("changing a typed (number) property emits delete + add for the typed literal", () => {
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        parent.hasNumber = 2

        assert.deepEqual(events, [
            "delete:hasNumber:1.0E0",
            "add:hasNumber:2",
        ])
        stop()
    })

    await it("adding to a Set-mapped property emits a single add", () => {
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        const newChild = new Child(DataFactory.namedNode("https://example.org/new-child"), ds, dataFactory)
        parent.hasChildSet.add(newChild)

        assert.deepEqual(events, ["add:hasChildSet:https://example.org/new-child"])
        stop()
    })

    await it("removing from a Set-mapped property emits a single delete", () => {
        const { ds, parent } = load()
        const [first] = Array.from(parent.hasChildSet)
        const { events, stop } = recordEvents(ds)

        parent.hasChildSet.delete(first!)

        assert.deepEqual(events, [`delete:hasChildSet:${first!.value}`])
        stop()
    })

    await it("removing a value not in the Set is a no-op and emits nothing", () => {
        const { ds, parent } = load()
        const { events, stop } = recordEvents(ds)

        const stranger = new Child(DataFactory.namedNode("https://example.org/stranger"), ds, dataFactory)
        parent.hasChildSet.delete(stranger)

        assert.deepEqual(events, [])
        stop()
    })

    await it("clearing a Set-mapped property emits a delete per remaining item", () => {
        const { ds, parent } = load()
        const childIris = Array.from(parent.hasChildSet, c => c.value).sort()
        const { events, stop } = recordEvents(ds)

        parent.hasChildSet.clear()

        assert.deepEqual(
            events.sort(),
            childIris.map(iri => `delete:hasChildSet:${iri}`).sort(),
        )
        stop()
    })
})
