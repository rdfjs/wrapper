import { describe, it } from "node:test"
import { LiteralFrom } from "@rdfjs/wrapper"
import { DataFactory } from "n3"
import assert from "node:assert"
import { Parent } from "./model/Parent.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

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

    await describe("bigint", async () => {
        await it("produces an xsd:integer lexical", async () => {
            const term = LiteralFrom.bigint(9007199254740993n, DataFactory)
            assert.strictEqual(term.value, "9007199254740993")
            assert.strictEqual((term as any).datatype.value, `${XSD}integer`)
        })

        await it("round-trips through a model property without loss of precision", async () => {
            const parent = new Parent("x", datasetFromRdf(""), DataFactory)
            parent.hasBigint = 9007199254740993n
            assert.strictEqual(parent.hasBigint, 9007199254740993n)
        })
    })

    await describe("symbol", async () => {
        await it("produces a string literal from a registered symbol", async () => {
            const term = LiteralFrom.symbol(Symbol.for("example"), DataFactory)
            assert.strictEqual(term.value, "example")
            assert.strictEqual((term as any).datatype.value, `${XSD}string`)
        })

        await it("round-trips through a model property", async () => {
            const parent = new Parent("x", datasetFromRdf(""), DataFactory)
            parent.hasSymbol = Symbol.for("example")
            assert.strictEqual(parent.hasSymbol, Symbol.for("example"))
        })

        await it("throws a TypeError for a symbol not in the global symbol registry", async () => {
            assert.throws(() => LiteralFrom.symbol(Symbol("example"), DataFactory), TypeError)
        })
    })
})
