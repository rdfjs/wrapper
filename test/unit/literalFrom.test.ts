import { describe, it } from "node:test"
import { LiteralFrom } from "@rdfjs/wrapper"
import { DataFactory } from "n3"
import assert from "node:assert"

const XSD = "http://www.w3.org/2001/XMLSchema#"

await describe("LiteralFrom", async () => {
    await describe("date", async () => {
        await it("produces a valid xsd:date lexical (YYYY-MM-DD), not a dateTime", async () => {
            const term = LiteralFrom.date(new Date("2026-07-01T00:00:00.000Z"), DataFactory)
            assert.strictEqual(term.value, "2026-07-01")
            assert.strictEqual((term as any).datatype.value, `${XSD}date`)
        })
    })

    await describe("dateTime", async () => {
        await it("produces an xsd:dateTime lexical", async () => {
            const term = LiteralFrom.dateTime(new Date("2026-07-01T08:30:00.000Z"), DataFactory)
            assert.strictEqual(term.value, "2026-07-01T08:30:00.000Z")
            assert.strictEqual((term as any).datatype.value, `${XSD}dateTime`)
        })
    })
})
