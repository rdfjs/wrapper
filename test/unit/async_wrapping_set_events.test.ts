import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import {
    AsyncDatasetWrapper,
    AsyncLiteralAs,
    AsyncSetFrom,
    AsyncTermAs,
    AsyncTermWrapper,
    AsyncWrappingSet,
    DatasetEventsError,
    LiteralFrom,
    TermFrom,
    type AsyncWrappingSetListener
} from "@rdfjs/wrapper"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"

const EX = "https://example.org/"
const HAS_CHILD = `${EX}hasChild`
const HAS_NICKNAME = `${EX}hasNickname`

class Person extends AsyncTermWrapper {
    public get children(): AsyncWrappingSet<Person> {
        return AsyncSetFrom.subjectPredicate(this, HAS_CHILD, AsyncTermAs.instance(Person), TermFrom.instance)
    }

    public get nicknames(): AsyncWrappingSet<string> {
        return AsyncSetFrom.subjectPredicate(this, HAS_NICKNAME, AsyncLiteralAs.string, LiteralFrom.string)
    }
}

/**
 * Parses the given Turtle and exposes it through the notifying asynchronous surface of {@link AsyncDatasetWrapper}.
 */
function notifyingDatasetFromRdf(rdf: string): AsyncDatasetWrapper {
    return new AsyncDatasetWrapper(asyncDatasetFromRdf(rdf), DataFactory)
}

/**
 * Subscribes a recorder to `set` and returns the captured events plus a
 * `stop` function that detaches it again.
 *
 * Events are recorded as `"<event>:<projected value>"` so the tests can
 * assert exactly which values were added or removed.
 */
function recordEvents<T>(set: AsyncWrappingSet<T>, project: (value: T) => string): { events: string[], stop: () => void } {
    const events: string[] = []
    const listener: AsyncWrappingSetListener<T> = (event, value) => {
        events.push(`${event}:${project(value)}`)
    }
    set.on(listener)
    return { events, stop: () => set.off(listener) }
}

async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const items: T[] = []

    for await (const item of iterable) {
        items.push(item)
    }

    return items
}

await describe("Async wrapping set events", async () => {
    await it("emits add events with the mapped value", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const carol = new Person(`${EX}carol`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        await alice.children.add(bob)
        await alice.children.add(carol)

        assert.deepEqual(events, [`add:${EX}bob`, `add:${EX}carol`])
        assert.deepEqual((await toArray(alice.children)).map(child => child.value).sort(), [`${EX}bob`, `${EX}carol`])
        stop()
    })

    await it("projects literal objects through the configured mapping", async () => {
        const dataset = notifyingDatasetFromRdf(`<${EX}alice> <${HAS_NICKNAME}> "Alice" .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.nicknames, value => value)

        await alice.nicknames.add("Ally")
        await alice.nicknames.delete("Alice")

        assert.deepEqual(events, ["add:Ally", "delete:Alice"])
        stop()
    })

    await it("emits delete events for removals and clear()", async () => {
        const dataset = notifyingDatasetFromRdf(`<${EX}alice> <${HAS_CHILD}> <${EX}bob>, <${EX}carol> .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        await alice.children.delete(bob)
        await alice.children.clear()

        assert.deepEqual(events, [`delete:${EX}bob`, `delete:${EX}carol`])
        assert.equal(await alice.children.size, 0)
        stop()
    })

    await it("awaits asynchronous listeners, which observe a live view when re-iterating the set", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const snapshots: string[][] = []
        const listener: AsyncWrappingSetListener<Person> = async () => {
            snapshots.push((await toArray(alice.children)).map(child => child.value).sort())
        }
        alice.children.on(listener)

        await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))
        await alice.children.add(new Person(`${EX}carol`, dataset, DataFactory))
        await alice.children.add(new Person(`${EX}dave`, dataset, DataFactory))

        assert.deepEqual(snapshots, [
            [`${EX}bob`],
            [`${EX}bob`, `${EX}carol`],
            [`${EX}bob`, `${EX}carol`, `${EX}dave`]
        ])
        alice.children.off(listener)
    })

    await it("ignores changes on other subjects or predicates", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const eve = new Person(`${EX}eve`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        // A child added to a different subject must not surface on Alice's set.
        await eve.children.add(new Person(`${EX}mallory`, dataset, DataFactory))
        // A different predicate on Alice must not surface either.
        await alice.nicknames.add("Ally")

        assert.deepEqual(events, [])
        stop()
    })

    await it("observes mutations made directly on the dataset", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)
        const quad = DataFactory.quad(
            DataFactory.namedNode(`${EX}alice`),
            DataFactory.namedNode(HAS_CHILD),
            DataFactory.namedNode(`${EX}bob`)
        )

        await dataset.add(quad)
        await dataset.delete(quad)

        assert.deepEqual(events, [`add:${EX}bob`, `delete:${EX}bob`])
        stop()
    })

    await it("emits nothing when adding a value that is already in the set", async () => {
        const dataset = notifyingDatasetFromRdf(`<${EX}alice> <${HAS_CHILD}> <${EX}bob> .`)
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const bob = new Person(`${EX}bob`, dataset, DataFactory)
        const { events, stop } = recordEvents(alice.children, child => child.value)

        await alice.children.add(bob)

        assert.deepEqual(events, [])
        stop()
    })

    await it("supports multiple independent listeners on the same set", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const first = recordEvents(alice.children, child => child.value)
        const second = recordEvents(alice.children, child => child.value)

        await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

        assert.deepEqual(first.events, [`add:${EX}bob`])
        assert.deepEqual(second.events, [`add:${EX}bob`])
        first.stop()
        second.stop()
    })

    await describe("off", async () => {
        await it("detaches the listener across fresh instances", async () => {
            const dataset = notifyingDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const events: string[] = []
            const listener: AsyncWrappingSetListener<Person> = (event, child) => {
                events.push(`${event}:${child.value}`)
            }

            // Each property access constructs a fresh AsyncWrappingSet, so
            // this exercises detaching via a different instance than was
            // used for on().
            alice.children.on(listener)
            alice.children.off(listener)

            await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

            assert.deepEqual(events, [])
        })

        await it("ignores a listener that was never attached", async () => {
            const dataset = notifyingDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)

            assert.doesNotThrow(() => alice.children.off(() => undefined))
        })

        await it("does not detach a listener attached to a different subject", async () => {
            const dataset = notifyingDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const eve = new Person(`${EX}eve`, dataset, DataFactory)
            const events: string[] = []
            const listener: AsyncWrappingSetListener<Person> = (event, child) => {
                events.push(`${event}:${child.value}`)
            }
            alice.children.on(listener)

            eve.children.off(listener)
            await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

            assert.deepEqual(events, [`add:${EX}bob`])
            alice.children.off(listener)
        })

        await it("only detaches the given subject and predicate when a listener observes several", async () => {
            const dataset = notifyingDatasetFromRdf("")
            const alice = new Person(`${EX}alice`, dataset, DataFactory)
            const events: string[] = []
            const listener: AsyncWrappingSetListener<any> = (event, value) => {
                events.push(`${event}:${typeof value === "string" ? value : value.value}`)
            }
            alice.children.on(listener)
            alice.nicknames.on(listener)

            alice.children.off(listener)
            await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))
            await alice.nicknames.add("Ally")

            assert.deepEqual(events, ["add:Ally"])
            alice.nicknames.off(listener)
        })
    })

    await it("replaces the subscription when the same listener is attached again", async () => {
        const dataset = notifyingDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)
        const events: string[] = []
        const listener: AsyncWrappingSetListener<Person> = (event, child) => {
            events.push(`${event}:${child.value}`)
        }

        alice.children.on(listener)
        alice.children.on(listener)

        await alice.children.add(new Person(`${EX}bob`, dataset, DataFactory))

        assert.deepEqual(events, [`add:${EX}bob`])
        alice.children.off(listener)
    })

    await it("throws when the underlying dataset does not emit change events", async () => {
        const dataset = asyncDatasetFromRdf("")
        const alice = new Person(`${EX}alice`, dataset, DataFactory)

        assert.throws(() => alice.children.on(() => undefined), DatasetEventsError)
    })
})
