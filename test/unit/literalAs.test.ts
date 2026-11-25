import { describe, it } from "node:test"
import { LiteralAs, LiteralDatatypeError, TermTypeError, TermWrapper } from "@rdfjs/wrapper"
import { DataFactory, Store } from "n3"
import assert from "node:assert"

// TODO: Cover other methods in LiteralAS
// TODO: Cover LiteralFrom
await describe("LiteralAs", async () => {
    await describe("number", async () => {
        const read = (value: string, datatype: string) => LiteralAs.number(new TermWrapper(DataFactory.literal(value, DataFactory.namedNode(`http://www.w3.org/2001/XMLSchema#${datatype}`)), new Store(), DataFactory))

        for (const datatype of ["double", "float"]) {
            await it(`reads INF as Infinity (${datatype})`, async () => {
                assert.strictEqual(read("INF", datatype), Infinity)
            })

            await it(`reads +INF as Infinity (${datatype})`, async () => {
                assert.strictEqual(read("+INF", datatype), Infinity)
            })

            await it(`reads -INF as -Infinity (${datatype})`, async () => {
                assert.strictEqual(read("-INF", datatype), -Infinity)
            })

            await it(`reads NaN as NaN (${datatype})`, async () => {
                assert.ok(Number.isNaN(read("NaN", datatype)))
            })
        }
    })

    await describe("number lexical validation", async () => {
        const read = (value: string, datatype: string) => LiteralAs.number(new TermWrapper(DataFactory.literal(value, DataFactory.namedNode(`http://www.w3.org/2001/XMLSchema#${datatype}`)), new Store(), DataFactory))

        for (const datatype of ["integer", "nonPositiveInteger", "long", "nonNegativeInteger", "negativeInteger", "int", "unsignedLong", "positiveInteger", "short", "unsignedInt", "byte", "unsignedShort", "unsignedByte"]) {
            await it(`reads valid lexicals (${datatype})`, async () => {
                assert.strictEqual(read("12", datatype), 12)
                assert.strictEqual(read("+12", datatype), 12)
                assert.strictEqual(read("-12", datatype), -12)
                assert.strictEqual(read("007", datatype), 7)
                assert.strictEqual(read(" 12\n", datatype), 12)
            })

            for (const invalid of ["abc", "", " ", "0x10", "Infinity", "INF", "NaN", "1.", ".5", "1.5", "1e3", "1 2", "--1"]) {
                await it(`throws on ${JSON.stringify(invalid)} (${datatype})`, async () => {
                    assert.throws(() => read(invalid, datatype), SyntaxError)
                })
            }
        }

        await it("reads valid lexicals (decimal)", async () => {
            assert.strictEqual(read("1.5", "decimal"), 1.5)
            assert.strictEqual(read("-1.5", "decimal"), -1.5)
            assert.strictEqual(read("+1.", "decimal"), 1)
            assert.strictEqual(read(".5", "decimal"), 0.5)
            assert.strictEqual(read("12", "decimal"), 12)
            assert.strictEqual(read(" 1.5 ", "decimal"), 1.5)
        })

        for (const invalid of ["abc", "", " ", "0x10", "Infinity", "INF", "NaN", ".", "1e3", "1.2.3"]) {
            await it(`throws on ${JSON.stringify(invalid)} (decimal)`, async () => {
                assert.throws(() => read(invalid, "decimal"), SyntaxError)
            })
        }

        for (const datatype of ["double", "float"]) {
            await it(`reads valid lexicals (${datatype})`, async () => {
                assert.strictEqual(read("12", datatype), 12)
                assert.strictEqual(read("-1.5", datatype), -1.5)
                assert.strictEqual(read("1.", datatype), 1)
                assert.strictEqual(read(".5", datatype), 0.5)
                assert.strictEqual(read("1E3", datatype), 1000)
                assert.strictEqual(read("1.5e-2", datatype), 0.015)
                assert.strictEqual(read("+1e+2", datatype), 100)
                assert.strictEqual(read(" INF ", datatype), Infinity)
            })

            for (const invalid of ["abc", "", " ", "0x10", "Infinity", "-Infinity", "inf", "nan", "+NaN", "1e", "e1", ".", "1_0"]) {
                await it(`throws on ${JSON.stringify(invalid)} (${datatype})`, async () => {
                    assert.throws(() => read(invalid, datatype), SyntaxError)
                })
            }
        }

        await it("throws on INF for non-floating-point datatypes", async () => {
            assert.throws(() => read("INF", "decimal"), SyntaxError)
            assert.throws(() => read("INF", "integer"), SyntaxError)
        })
    })

    await describe("bigint", async () => {
        const read = (value: string, datatype = "integer") => LiteralAs.bigint(new TermWrapper(DataFactory.literal(value, DataFactory.namedNode(`http://www.w3.org/2001/XMLSchema#${datatype}`)), new Store(), DataFactory))

        await it("reads valid lexicals", async () => {
            assert.strictEqual(read("12"), 12n)
            assert.strictEqual(read("+12"), 12n)
            assert.strictEqual(read("-12"), -12n)
            assert.strictEqual(read(" 12 "), 12n)
            assert.strictEqual(read("123456789012345678901234567890"), 123456789012345678901234567890n)
            assert.strictEqual(read("255", "unsignedByte"), 255n)
        })

        for (const invalid of ["abc", "", " ", "0x10", "1.", ".5", "1.5", "1e3", "Infinity", "INF", "NaN", "1n"]) {
            await it(`throws on ${JSON.stringify(invalid)}`, async () => {
                assert.throws(() => read(invalid), SyntaxError)
            })
        }

        await it("throws on non-integer datatype", async () => {
            assert.throws(() => read("1", "decimal"), LiteralDatatypeError)
        })
    })

    await describe("date", async () => {
        const read = (value: string, datatype: string) => LiteralAs.date(new TermWrapper(DataFactory.literal(value, DataFactory.namedNode(`http://www.w3.org/2001/XMLSchema#${datatype}`)), new Store(), DataFactory))

        const valid: [string, string, string][] = [
            ["date", "2023-05-17", "2023-05-17T00:00:00.000Z"],
            ["date", "2023-05-17Z", "2023-05-17T00:00:00.000Z"],
            ["date", "2023-05-17+02:00", "2023-05-16T22:00:00.000Z"],
            ["date", "2023-05-17-14:00", "2023-05-17T14:00:00.000Z"],
            ["date", " 2023-05-17 ", "2023-05-17T00:00:00.000Z"],
            ["date", "2024-02-29", "2024-02-29T00:00:00.000Z"],
            ["date", "0000-01-01", "0000-01-01T00:00:00.000Z"],
            ["date", "-0001-01-01", "-000001-01-01T00:00:00.000Z"],
            ["date", "12345-01-01", "+012345-01-01T00:00:00.000Z"],
            ["dateTime", "2023-05-17T10:20:30Z", "2023-05-17T10:20:30.000Z"],
            ["dateTime", "2023-05-17T10:20:30.5Z", "2023-05-17T10:20:30.500Z"],
            ["dateTime", "2023-05-17T10:20:30.123456Z", "2023-05-17T10:20:30.123Z"],
            ["dateTime", "2023-05-17T10:20:30+05:30", "2023-05-17T04:50:30.000Z"],
            ["dateTime", "2023-05-17T10:20:30-14:00", "2023-05-18T00:20:30.000Z"],
            ["dateTime", "2023-05-17T24:00:00Z", "2023-05-18T00:00:00.000Z"],
            ["dateTime", "2023-12-31T24:00:00.000Z", "2024-01-01T00:00:00.000Z"],
            ["dateTime", " 2023-05-17T10:20:30Z\n", "2023-05-17T10:20:30.000Z"],
            ["dateTime", "12345-05-17T10:20:30Z", "+012345-05-17T10:20:30.000Z"],
            ["dateTime", "-0044-03-15T12:00:00Z", "-000044-03-15T12:00:00.000Z"],
        ]

        for (const [datatype, lexical, expected] of valid) {
            await it(`reads ${JSON.stringify(lexical)} (${datatype})`, async () => {
                assert.strictEqual(read(lexical, datatype).toISOString(), expected)
            })
        }

        const invalidDates = ["", " ", "abc", "2023-5-17", "23-05-17", "02023-05-17", "2023-13-01", "2023-00-10", "2023-05-00", "2023-05-32", "2023-02-29", "1900-02-29", "2023-04-31", "2023-05-17T10:20:30Z", "2023-05-17+15:00", "2023-05-17+14:01", "2023-05-17+02:60", "2023-05-17z", "20230517", "+2023-05-17", "-0000-1-01"]

        for (const lexical of invalidDates) {
            await it(`throws on ${JSON.stringify(lexical)} (date)`, async () => {
                assert.throws(() => read(lexical, "date"), SyntaxError)
            })
        }

        const invalidDateTimes = ["", " ", "abc", "2023-05-17", "2023-05-17T10:20Z", "2023-05-17 10:20:30Z", "2023-05-17T1:20:30Z", "2023-05-17T25:00:00Z", "2023-05-17T10:60:00Z", "2023-05-17T10:20:60Z", "2023-05-17T24:00:01Z", "2023-05-17T24:01:00Z", "2023-05-17T24:00:00.5Z", "2023-02-30T10:20:30Z", "2023-05-17T10:20:30+14:30", "2023-05-17T10:20:30+0200", "2023-05-17T10:20:30.Z", "2023-05-17T10:20:30z", "2023-05-17T10:20:30Zjunk", "Tue May 16 2023"]

        for (const lexical of invalidDateTimes) {
            await it(`throws on ${JSON.stringify(lexical)} (dateTime)`, async () => {
                assert.throws(() => read(lexical, "dateTime"), SyntaxError)
            })
        }

        await it("throws when the year is out of the range of Date", async () => {
            assert.throws(() => read("999999-01-01", "date"), SyntaxError)
            assert.throws(() => read("-999999-01-01T00:00:00Z", "dateTime"), SyntaxError)
        })

        await it("reads dateTime without timezone as local time", async () => {
            assert.strictEqual(read("2023-05-17T10:20:30", "dateTime").getTime(), new Date(2023, 4, 17, 10, 20, 30).getTime())
        })

        await it("reads date without timezone as UTC", async () => {
            assert.strictEqual(read("2023-05-17", "date").toISOString(), "2023-05-17T00:00:00.000Z")
        })
    })

    await describe("uInt8Array", async () => {
        await it("throws when undefined", async () => {
            assert.throws(() => LiteralAs.uInt8Array(undefined!), ReferenceError)
        })

        await it("throws when null", async () => {
            assert.throws(() => LiteralAs.uInt8Array(null!), ReferenceError)
        })

        await it("throws when not term", async () => {
            assert.throws(() => LiteralAs.uInt8Array("" as any), TypeError)
        })

        await it("throws when not literal", async () => {
            const wrapper = new TermWrapper(DataFactory.blankNode(), new Store(), DataFactory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), TermTypeError)
        })

        await it("throws when datatype mismatch", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("", DataFactory.namedNode("d")), new Store(), DataFactory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), LiteralDatatypeError)
        })

        await it("throws when illegal base64", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), new Store(), DataFactory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), SyntaxError)
        })

        await it("throws when illegal hex", async () => {
            const wrapper = new TermWrapper(DataFactory.literal("X", DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), new Store(), DataFactory)

            assert.throws(() => LiteralAs.uInt8Array(wrapper), SyntaxError)
        })

        await it("converts base64", async () => {
            const encoded = "MDEyMzQ1Njc4OQ=="
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#base64Binary")), new Store(), DataFactory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "base64"))

            assert.deepStrictEqual(LiteralAs.uInt8Array(wrapper), bytes)
        })

        await it("converts hex", async () => {
            const encoded = "30313233343536373839"
            const wrapper = new TermWrapper(DataFactory.literal(encoded, DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#hexBinary")), new Store(), DataFactory)
            const bytes = Uint8Array.from(Buffer.from(encoded, "hex"))

            assert.deepStrictEqual(LiteralAs.uInt8Array(wrapper), bytes)
        })
    })
})
