import assert from "node:assert"
import { describe, it } from "node:test"
import { LiteralAs, LiteralFrom, SetFrom, TermWrapper, WrappingSet } from "@rdfjs/wrapper"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

class Wrapper extends TermWrapper {
    public get strings(): WrappingSet<string> {
        return SetFrom.subjectPredicate(this, "p", LiteralAs.string, LiteralFrom.string)
    }
}

await describe("Wrapping set", async () => {
    await it("is returned by set-mapped model properties", async () => {
        const rdf = `<s> <p> "o1", "o2" .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.strictEqual(wrapper.strings instanceof WrappingSet, true)
        assert.strictEqual(wrapper.strings.size, 2)
    })
})
