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

    await describe("integer", async () => {
        const roundTrip = (value: number | bigint) => LiteralAs.bigint(new TermWrapper(LiteralFrom.integer(value, DataFactory), new Store(), DataFactory))

        await it("produces xsd:integer datatype", async () => {
            const term = LiteralFrom.integer(5, DataFactory)
            assert.strictEqual((term as any).datatype.value, `${XSD}integer`)
        })

        await it("produces canonical lexical for number", async () => {
            assert.strictEqual(LiteralFrom.integer(0, DataFactory).value, "0")
            assert.strictEqual(LiteralFrom.integer(-0, DataFactory).value, "0")
            assert.strictEqual(LiteralFrom.integer(5, DataFactory).value, "5")
            assert.strictEqual(LiteralFrom.integer(-3, DataFactory).value, "-3")
            assert.strictEqual(LiteralFrom.integer(1e21, DataFactory).value, "1000000000000000000000")
            assert.strictEqual(LiteralFrom.integer(-1e21, DataFactory).value, "-1000000000000000000000")
        })

        await it("produces canonical lexical for bigint", async () => {
            assert.strictEqual(LiteralFrom.integer(0n, DataFactory).value, "0")
            assert.strictEqual(LiteralFrom.integer(-3n, DataFactory).value, "-3")
            assert.strictEqual(LiteralFrom.integer(123456789012345678901234567890n, DataFactory).value, "123456789012345678901234567890")
        })

        await it("throws for NaN", async () => {
            assert.throws(() => LiteralFrom.integer(NaN, DataFactory))
        })

        await it("throws for Infinity", async () => {
            assert.throws(() => LiteralFrom.integer(Infinity, DataFactory))
        })

        await it("throws for -Infinity", async () => {
            assert.throws(() => LiteralFrom.integer(-Infinity, DataFactory))
        })

        await it("throws for non-integer", async () => {
            assert.throws(() => LiteralFrom.integer(1.5, DataFactory))
        })

        await it("round-trips through LiteralAs.bigint", async () => {
            assert.strictEqual(roundTrip(0), 0n)
            assert.strictEqual(roundTrip(-0), 0n)
            assert.strictEqual(roundTrip(5), 5n)
            assert.strictEqual(roundTrip(-3), -3n)
            assert.strictEqual(roundTrip(1e21), 10n ** 21n)
            assert.strictEqual(roundTrip(123456789012345678901234567890n), 123456789012345678901234567890n)
        })

        await it("round-trips through LiteralAs.number", async () => {
            const term = LiteralFrom.integer(-3, DataFactory)
            assert.strictEqual(LiteralAs.number(new TermWrapper(term, new Store(), DataFactory)), -3)
        })
    })

    await describe("base64", async () => {
        await it("produces xsd:base64Binary lexical", async () => {
            const term = LiteralFrom.base64(Uint8Array.from([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]), DataFactory)
            assert.strictEqual(term.value, "MDEyMzQ1Njc4OQ==")
            assert.strictEqual((term as any).datatype.value, `${XSD}base64Binary`)
        })

        await it("produces empty lexical for empty array", async () => {
            const term = LiteralFrom.base64(new Uint8Array(0), DataFactory)
            assert.strictEqual(term.value, "")
            assert.strictEqual((term as any).datatype.value, `${XSD}base64Binary`)
        })

        await it("respects byteOffset of subarray", async () => {
            const term = LiteralFrom.base64(Uint8Array.from([0, 1, 2, 3, 4]).subarray(2, 4), DataFactory)
            assert.strictEqual(term.value, "AgM=")
        })

        await it("round-trips through LiteralAs.uInt8Array", async () => {
            const bytes = Uint8Array.from([0, 255, 128, 7, 42])
            const term = LiteralFrom.base64(bytes, DataFactory)
            assert.deepStrictEqual(LiteralAs.uInt8Array(new TermWrapper(term, new Store(), DataFactory)), bytes)
        })
    })

    await describe("hex", async () => {
        await it("produces xsd:hexBinary lexical", async () => {
            const term = LiteralFrom.hex(Uint8Array.from([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]), DataFactory)
            assert.strictEqual(term.value, "30313233343536373839")
            assert.strictEqual((term as any).datatype.value, `${XSD}hexBinary`)
        })

        await it("produces empty lexical for empty array", async () => {
            const term = LiteralFrom.hex(new Uint8Array(0), DataFactory)
            assert.strictEqual(term.value, "")
            assert.strictEqual((term as any).datatype.value, `${XSD}hexBinary`)
        })

        await it("respects byteOffset of subarray", async () => {
            const term = LiteralFrom.hex(Uint8Array.from([0, 1, 2, 3, 4]).subarray(2, 4), DataFactory)
            assert.strictEqual(term.value, "0203")
        })

        await it("round-trips through LiteralAs.uInt8Array", async () => {
            const bytes = Uint8Array.from([0, 255, 128, 7, 42])
            const term = LiteralFrom.hex(bytes, DataFactory)
            assert.deepStrictEqual(LiteralAs.uInt8Array(new TermWrapper(term, new Store(), DataFactory)), bytes)
        })
    })
})
