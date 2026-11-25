import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import {
    DatasetEventsError,
    LiteralAs,
    LiteralFrom,
    SetFrom,
    TermAs,
    TermFrom,
    TermWrapper,
    WrappingSet,
    type WrappingSetListener
} from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { eventfulDatasetFromRdf } from "./util/eventfulDatasetFromRdf.js"

const EX = "https://example.org/"
const HAS_CHILD = `${EX}hasChild`
const HAS_NICKNAME = `${EX}hasNickname`

class Person extends TermWrapper {
    public get children(): WrappingSet<Person> {
        return SetFrom.subjectPredicate(this, HAS_CHILD, TermAs.instance(Person), TermFrom.instance)
    }

    public get nicknames(): WrappingSet<string> {
        return SetFrom.subjectPredicate(this, HAS_NICKNAME, LiteralAs.string, LiteralFrom.string)
    }
}

/**
 * Subscribes a recorder to `set` and returns the captured events plus a
 * `stop` function that detaches it again.
 *
 * Events are recorded as `"<event>:<projected value>"` so the tests can
 * assert exactly which values were added or removed.
 */
function recordEvents<T>(set: WrappingSet<T>, project: (value: T) => string): { events: string[], stop: () => void } {
    const events: string[] = []
    const listener: WrappingSetListener<T> = (event, value) => {
        events.push(`${event}:${project(value)}`)
    }
    set.on(listener)
    return { events, stop: () => set.off(listener) }
}

await describe("Wrapping set events", async () => {
    await it("emits add events with the mapped value", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const carol = new Person(`${EX}carol`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        alice.children.add(bob)
        alice.children.add(carol)

        assert.deepEqual(events, [`add:${EX}bob`, `add:${EX}carol`])
        assert.deepEqual(Array.from(alice.children, child => child.value).sort(), [`${EX}bob`, `${EX}carol`])
        stop()
    })

    await it("projects literal objects through the configured mapping", () => {
        const dataset = eventfulDatasetFromRdf(`<${EX}alice> <${HAS_NICKNAME}> "Alice" .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.nicknames, value => value)

        alice.nicknames.add("Ally")
        alice.nicknames.delete("Alice")

        assert.deepEqual(events, ["add:Ally", "delete:Alice"])
        stop()
    })

    await it("emits delete events for removals and clear()", () => {
        const dataset = eventfulDatasetFromRdf(`<${EX}alice> <${HAS_CHILD}> <${EX}bob>, <${EX}carol> .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        alice.children.delete(bob)
        alice.children.clear()

        assert.deepEqual(events, [`delete:${EX}bob`, `delete:${EX}carol`])
        assert.equal(alice.children.size, 0)
        stop()
    })

    await it("re-iterating the set inside the listener observes a live view", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const snapshots: string[][] = []
        const listener: WrappingSetListener<Person> = () => {
            snapshots.push(Array.from(alice.children, child => child.value).sort())
        }
        alice.children.on(listener)

        alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))
        alice.children.add(new Person(`${EX}carol`, dataset, DataFactory))
        alice.children.add(new Person(`${EX}dave`, dataset, DataFactory))

        assert.deepEqual(snapshots, [
            [`${EX}bob`],
            [`${EX}bob`, `${EX}carol`],
            [`${EX}bob`, `${EX}carol`, `${EX}dave`]
        ])
        alice.children.off(listener)
    })

    await it("ignores changes on other subjects or predicates", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const eve = new Person(`${EX}eve`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        // A child added to a different subject must not surface on Alice's set.
        eve.children.add(new Person(`${EX}mallory`, dataset, DataFactory))
        // A different predicate on Alice must not surface either.
        alice.nicknames.add("Ally")

        assert.deepEqual(events, [])
        stop()
    })

    await it("observes mutations made directly on the dataset", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)
        const quad = DataFactory.quad(
            DataFactory.namedNode(`${EX}alice`),
            DataFactory.namedNode(HAS_CHILD),
            DataFactory.namedNode(`${EX}bob`)
        )

        dataset.add(quad)
        dataset.delete(quad)

        assert.deepEqual(events, [`add:${EX}bob`, `delete:${EX}bob`])
        stop()
    })

    await it("emits nothing when adding a value that is already in the set", () => {
        const dataset = eventfulDatasetFromRdf(`<${EX}alice> <${HAS_CHILD}> <${EX}bob> .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        alice.children.add(bob)

        assert.deepEqual(events, [])
        stop()
    })

    await it("supports multiple independent listeners on the same set", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const first = recordEvents(alice.children, child => child.value)
        const second = recordEvents(alice.children, child => child.value)

        alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

        assert.deepEqual(first.events, [`add:${EX}bob`])
        assert.deepEqual(second.events, [`add:${EX}bob`])
        first.stop()
        second.stop()
    })

    await describe("off", async () => {
        await it("detaches the listener across fresh instances", () => {
            const dataset = eventfulDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const events: string[] = []
            const listener: WrappingSetListener<Person> = (event, child) => {
                events.push(`${event}:${child.value}`)
            }

            // Each property access constructs a fresh WrappingSet, so this
            // exercises detaching via a different instance than was used
            // for on().
            alice.children.on(listener)
            alice.children.off(listener)

            alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

            assert.deepEqual(events, [])
        })

        await it("ignores a listener that was never attached", () => {
            const dataset = eventfulDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)

            assert.doesNotThrow(() => alice.children.off(() => undefined))
        })

        await it("does not detach a listener attached to a different subject", () => {
            const dataset = eventfulDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const eve = new Person(`${EX}eve`, dataset, DataFactory)
            const events: string[] = []
            const listener: WrappingSetListener<Person> = (event, child) => {
                events.push(`${event}:${child.value}`)
            }
            alice.children.on(listener)

            eve.children.off(listener)
            alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

            assert.deepEqual(events, [`add:${EX}bob`])
            alice.children.off(listener)
        })

        await it("only detaches the given subject and predicate when a listener observes several", () => {
            const dataset = eventfulDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const events: string[] = []
            const listener: WrappingSetListener<any> = (event, value) => {
                events.push(`${event}:${typeof value === "string" ? value : value.value}`)
            }
            alice.children.on(listener)
            alice.nicknames.on(listener)

            alice.children.off(listener)
            alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))
            alice.nicknames.add("Ally")

            assert.deepEqual(events, ["add:Ally"])
            alice.nicknames.off(listener)
        })
    })

    await it("replaces the subscription when the same listener is attached again", () => {
        const dataset = eventfulDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const events: string[] = []
        const listener: WrappingSetListener<Person> = (event, child) => {
            events.push(`${event}:${child.value}`)
        }

        alice.children.on(listener)
        alice.children.on(listener)

        alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

        assert.deepEqual(events, [`add:${EX}bob`])
        alice.children.off(listener)
    })

    await it("throws when the underlying dataset does not emit change events", () => {
        const dataset = datasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)

        assert.throws(() => alice.children.on(() => undefined), DatasetEventsError)
    })
})
