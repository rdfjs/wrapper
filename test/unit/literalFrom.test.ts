import { describe, it } from "node:test"
import { LiteralAs, LiteralFrom, TermWrapper } from "@rdfjs/wrapper"
import { DataFactory, Store } from "n3"
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
    await describe("double", async () => {
        const roundTrip = (value: number) => LiteralAs.number(new TermWrapper(LiteralFrom.double(value, DataFactory), new Store(), DataFactory))

        await it("produces xsd:double datatype", async () => {
            const term = LiteralFrom.double(1.5, DataFactory)
            assert.strictEqual((term as any).datatype.value, `${XSD}double`)
        })

        await it("produces lexical for finite value", async () => {
            assert.strictEqual(LiteralFrom.double(1.5, DataFactory).value, "1.5")
            assert.strictEqual(LiteralFrom.double(1e21, DataFactory).value, "1e+21")
            assert.strictEqual(LiteralFrom.double(1e-7, DataFactory).value, "1e-7")
        })

        await it("produces INF for Infinity", async () => {
            assert.strictEqual(LiteralFrom.double(Infinity, DataFactory).value, "INF")
        })

        await it("produces -INF for -Infinity", async () => {
            assert.strictEqual(LiteralFrom.double(-Infinity, DataFactory).value, "-INF")
        })

        await it("produces NaN for NaN", async () => {
            assert.strictEqual(LiteralFrom.double(NaN, DataFactory).value, "NaN")
        })

        await it("produces -0 for negative zero", async () => {
            assert.strictEqual(LiteralFrom.double(-0, DataFactory).value, "-0")
        })

        await it("round-trips through LiteralAs.number", async () => {
            assert.strictEqual(roundTrip(1.5), 1.5)
            assert.strictEqual(roundTrip(1e21), 1e21)
            assert.strictEqual(roundTrip(Infinity), Infinity)
            assert.strictEqual(roundTrip(-Infinity), -Infinity)
            assert.ok(Number.isNaN(roundTrip(NaN)))
            assert.ok(Object.is(roundTrip(-0), -0))
        })
    })


})
