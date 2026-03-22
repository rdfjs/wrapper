import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory, Store, Parser } from "n3"
import { Playlist, EX } from "./examples/rdf-lists.js"

await describe("docs/guides/rdf-lists — Full Example", async () => {
    const store = new Store()
    store.addQuads(new Parser().parse(`
        PREFIX ex:  <https://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        ex:playlist1 ex:tracks (
            "Track 1"
            "Track 2"
            "Track 3"
        ) .
    `))

    const playlist = new Playlist(EX + "playlist1", store, DataFactory)
    const tracks = playlist.tracks!

    await it("reads first track", async () => {
        assert.strictEqual(tracks[0], "Track 1")
    })

    await it("has correct initial length", async () => {
        assert.strictEqual(tracks.length, 3)
    })

    await it("push appends a track", async () => {
        tracks.push("Track 4")
        assert.strictEqual(tracks.length, 4)
    })

    await it("shift removes and returns the first element", async () => {
        tracks.shift()
        assert.strictEqual(tracks[0], "Track 2")
    })

    await it("pop removes the last element", async () => {
        const last = tracks.pop()
        assert.strictEqual(last, "Track 4")
        assert.strictEqual(tracks.length, 2)
    })

    await it("unshift prepends an element", async () => {
        tracks.unshift("Track 0")
        assert.strictEqual(tracks[0], "Track 0")
        assert.strictEqual(tracks.length, 3)
    })

    await it("non-mutating operations work — includes", async () => {
        assert.strictEqual(tracks.includes("Track 2"), true)
    })

    await it("non-mutating operations work — indexOf", async () => {
        assert.strictEqual(tracks.indexOf("Track 2"), 1)
    })

    await it("non-mutating operations work — map", async () => {
        const upper = tracks.map(t => t.toUpperCase())
        assert.deepStrictEqual(upper, ["TRACK 0", "TRACK 2", "TRACK 3"])
    })
})
