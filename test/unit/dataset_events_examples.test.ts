import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import {
    DatasetWrapper,
    LiteralAs,
    LiteralFrom,
    OptionalAs,
    OptionalFrom,
    SetFrom,
    TermAs,
    TermFrom,
    TermWrapper,
} from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const EX = "https://example.org/"
const HAS_CHILD = `${EX}hasChild`
const HAS_EMAIL = `${EX}hasEmail`

class Person extends TermWrapper {
    /**
     * A live, mutable {@link Set} of this person's children, backed by `<this> :hasChild ?child` quads in the dataset. Iteration always reflects the current state of the dataset; calling `add()` / `delete()` / `clear()` writes through to the underlying graph and triggers change notifications on the containing {@link DatasetWrapper}.
     */
    public get children(): Set<Person> {
        return SetFrom.subjectPredicate(
            this,
            HAS_CHILD,
            TermAs.instance(Person),
            TermFrom.instance,
        )
    }

    /**
     * Optional email address. Setting to a string emits `delete` (of any previous value) followed by `add`. Setting to `undefined` emits only `delete`, or nothing if there was no previous value.
     */
    public get email(): string | undefined {
        return OptionalFrom.subjectPredicate(this, HAS_EMAIL, LiteralAs.string)
    }

    public set email(value: string | undefined) {
        OptionalAs.object(this, HAS_EMAIL, value, LiteralFrom.string)
    }
}

class People extends DatasetWrapper {
    public person(iri: string): Person {
        return new Person(iri, this, this.factory)
    }
}

await describe("Example: observing a children set backed by SetFrom", async () => {
    await it("emits add events as children are added and the set reflects current state", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const bob = ds.person(`${EX}bob`)
        const carol = ds.person(`${EX}carol`)

        const childEvents: string[] = []
        ds.on((event, quad) => {
            childEvents.push(`${event}:${quad.object.value}`)
        })

        assert.equal(alice.children.size, 0)

        alice.children.add(bob)
        alice.children.add(carol)

        assert.deepEqual(childEvents, [
            `add:${EX}bob`,
            `add:${EX}carol`,
        ])

        // The set always reflects the current state.
        assert.deepEqual(
            Array.from(alice.children).map(c => c.value).sort(),
            [`${EX}bob`, `${EX}carol`],
        )
    })

    await it("re-iterating children inside the listener observes new additions", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const snapshots: string[][] = []

        ds.on(() => {
            // Each notification captures a fresh snapshot of `alice.children`, proving the set is a live view, not a one-shot copy.
            snapshots.push(Array.from(alice.children).map(c => c.value))
        })

        alice.children.add(ds.person(`${EX}bob`))
        alice.children.add(ds.person(`${EX}carol`))
        alice.children.add(ds.person(`${EX}dave`))

        assert.deepEqual(snapshots, [
            [`${EX}bob`],
            [`${EX}bob`, `${EX}carol`],
            [`${EX}bob`, `${EX}carol`, `${EX}dave`],
        ])
    })

    await it("emits delete events for removals and clear()", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const bob = ds.person(`${EX}bob`)
        const carol = ds.person(`${EX}carol`)
        alice.children.add(bob)
        alice.children.add(carol)

        const events: string[] = []
        ds.on((event, quad) => {
            events.push(`${event}:${quad.object.value}`)
        })

        alice.children.delete(bob)
        alice.children.clear()

        assert.deepEqual(events, [
            `delete:${EX}bob`,
            `delete:${EX}carol`,
        ])
        assert.equal(alice.children.size, 0)
    })

    await it("emits matching add and delete events with the full quad", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const bob = ds.person(`${EX}bob`)

        const datasetEvents: string[] = []
        ds.on((event, q) => {
            datasetEvents.push(
                `${event}:${q.subject.value}:${q.predicate.value}:${q.object.value}`,
            )
        })

        alice.children.add(bob)
        alice.children.delete(bob)

        assert.deepEqual(datasetEvents, [
            `add:${EX}alice:${HAS_CHILD}:${EX}bob`,
            `delete:${EX}alice:${HAS_CHILD}:${EX}bob`,
        ])
    })

    await it("events fire once per item when clear() removes many", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const bob = ds.person(`${EX}bob`)
        const carol = ds.person(`${EX}carol`)
        alice.children.add(bob)
        alice.children.add(carol)

        const datasetEvents: string[] = []
        ds.on((event, q) => {
            if (q.predicate.value !== HAS_CHILD) {
                return
            }
            datasetEvents.push(`${event}:${q.object.value}`)
        })

        alice.children.clear()

        assert.deepEqual(datasetEvents.sort(), [
            `delete:${EX}bob`,
            `delete:${EX}carol`,
        ])
    })
})

await describe("Example: observing an optional email field", async () => {
    /** Records `set:<value>` and `unset:<value>` notifications for `:hasEmail`. */
    function watchEmail(ds: People): string[] {
        const log: string[] = []
        ds.on((event, q) => {
            if (q.predicate.value !== HAS_EMAIL) {
                return
            }
            log.push(`${event === "add" ? "set" : "unset"}:${q.object.value}`)
        })
        return log
    }

    await it("setting an email from undefined emits a single set event", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const log = watchEmail(ds)

        alice.email = "alice@example.org"

        assert.deepEqual(log, ["set:alice@example.org"])
        assert.equal(alice.email, "alice@example.org")
    })

    await it("changing an email emits unset (old) then set (new)", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        alice.email = "old@example.org"
        const log = watchEmail(ds)

        alice.email = "new@example.org"

        assert.deepEqual(log, ["unset:old@example.org", "set:new@example.org"])
        assert.equal(alice.email, "new@example.org")
    })

    await it("clearing an email emits only an unset event", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        alice.email = "alice@example.org"
        const log = watchEmail(ds)

        alice.email = undefined

        assert.deepEqual(log, ["unset:alice@example.org"])
        assert.equal(alice.email, undefined)
    })

    await it("clearing an already-empty email emits nothing", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        const log = watchEmail(ds)

        alice.email = undefined

        assert.deepEqual(log, [])
    })

    await it("emits matching add and delete events with the full quad when changing", () => {
        const ds = new People(datasetFromRdf(""), DataFactory)
        const alice = ds.person(`${EX}alice`)
        alice.email = "old@example.org"

        const datasetEvents: string[] = []
        ds.on((event, q) => {
            datasetEvents.push(
                `${event}:${q.subject.value}:${q.predicate.value}:${q.object.value}`,
            )
        })

        alice.email = "new@example.org"

        assert.deepEqual(datasetEvents, [
            `delete:${EX}alice:${HAS_EMAIL}:old@example.org`,
            `add:${EX}alice:${HAS_EMAIL}:new@example.org`,
        ])
    })
})
