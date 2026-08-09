import { dataFactory } from "./util/dataFactory.js"
import assert from "node:assert"
import { describe, it } from "node:test"
import { AsyncParent } from "./model/AsyncParent.js"
import { AsyncChild } from "./model/AsyncChild.js"
import { AsyncDatasetWrapper, type ChangeEvent } from "@rdfjs/wrapper"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"
import { asyncN3StoreFactory } from "./util/asyncN3StoreFactory.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasString "o1" ;
    :hasNumber "42"^^<http://www.w3.org/2001/XMLSchema#double> ;
    :hasBoolean "true"^^<http://www.w3.org/2001/XMLSchema#boolean> ;
    :hasLangString "hello"@en ;
    :hasNullableString "maybe" ;
    :hasChild <c1> ;
    :hasChildSet <c2>, <c3> ;
.
<c1> :hasString "child 1" .
<c2> :hasString "child 2" .
<c3> :hasString "child 3" .
`

await describe("Async Term Wrappers", async () => {
    const buildParent = () => {
        const dataset = asyncDatasetFromRdf(rdf, "https://example.org/")
        const wrapped = new AsyncDatasetWrapper(dataset, dataFactory, asyncN3StoreFactory)
        return new AsyncParent("https://example.org/x", wrapped, dataFactory)
    }

    await it("reads required value mappings as promises", async () => {
        const parent = buildParent()
        assert.equal(await parent.hasString, "o1")
        assert.equal(await parent.hasNumber, 42)
        assert.equal(await parent.hasBoolean, true)
        const lang = await parent.hasLangString
        assert.deepEqual(lang, { lang: "en", string: "hello" })
    })

    await it("reads optional value mappings as promises", async () => {
        const parent = buildParent()
        assert.equal(await parent.hasNullableString, "maybe")
    })

    await it("returns undefined for missing optional values", async () => {
        const dataset = asyncDatasetFromRdf("")
        const wrapped = new AsyncDatasetWrapper(dataset, dataFactory, asyncN3StoreFactory)
        const child = new AsyncChild("https://example.org/missing", wrapped, dataFactory)
        assert.equal(await child.hasString, undefined)
    })

    await it("writes through optional setters", async () => {
        const parent = buildParent()
        await parent.setHasNullableString("changed")
        assert.equal(await parent.hasNullableString, "changed")

        await parent.setHasNullableString(undefined)
        assert.equal(await parent.hasNullableString, undefined)
    })

    await it("writes through required setters", async () => {
        const parent = buildParent()
        await parent.setHasString("new value")
        assert.equal(await parent.hasString, "new value")
    })

    await it("traverses object mappings asynchronously", async () => {
        const parent = buildParent()
        const child = await parent.hasChild
        assert.ok(child instanceof AsyncChild)
        assert.equal(await child.hasString, "child 1")
    })

    await it("iterates async wrapping sets", async () => {
        const parent = buildParent()
        const seen: string[] = []
        for await (const child of parent.hasChildSet) {
            seen.push((await child.hasString)!)
        }
        assert.equal(seen.length, 2)
        assert.deepEqual(seen.sort(), ["child 2", "child 3"])
    })

    await it("size and has on async wrapping sets", async () => {
        const parent = buildParent()
        const set = parent.hasChildSet
        assert.equal(await set.size, 2)
        const c2 = new AsyncChild("https://example.org/c2", parent.dataset, dataFactory)
        assert.equal(await set.has(c2), true)
    })

    await it("add/delete on async wrapping sets emits events", async () => {
        const parent = buildParent()
        const set = parent.hasChildSet
        const events: Array<[ChangeEvent, string]> = []
        const listener = async (event: ChangeEvent, value: AsyncChild) => {
            events.push([event, value.value])
        }
        set.on(listener)

        const c4 = new AsyncChild("https://example.org/c4", parent.dataset, dataFactory)
        await set.add(c4)
        assert.equal(await set.size, 3)

        await set.delete(c4)
        assert.equal(await set.size, 2)

        set.off(listener)

        assert.deepEqual(events, [
            ["add", "https://example.org/c4"],
            ["delete", "https://example.org/c4"],
        ])
    })

    await it("dataset emits events on add and delete", async () => {
        const dataset = asyncDatasetFromRdf("")
        const wrapped = new AsyncDatasetWrapper(dataset, dataFactory, asyncN3StoreFactory)
        const events: ChangeEvent[] = []
        wrapped.on(async (event, _q) => {
            events.push(event)
        })

        const s = dataFactory.namedNode("https://example.org/s")
        const p = dataFactory.namedNode("https://example.org/p")
        const o = dataFactory.literal("v")
        const q = dataFactory.quad(s, p, o)

        await wrapped.add(q)
        await wrapped.delete(q)

        assert.deepEqual(events, ["add", "delete"])
    })
})
