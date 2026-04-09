import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { ListRootError, LiteralAs, LiteralFrom, RequiredFrom, TermAs, TermWrapper } from "@rdfjs/wrapper"
import assert from "node:assert"

class Wrapper extends TermWrapper {
    public get list(): string[] {
        return RequiredFrom.subjectPredicate(this, "p", TermAs.list(this, "p", LiteralAs.string, LiteralFrom.string))
    }
}

await describe("RDF List", async () => {
    await describe("not implemented", async () => {
        await it("copyWithin", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.copyWithin(undefined!, undefined!)
            }, /^Error: not implemented$/)
        })

        await it("fill", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.fill(undefined!)
            }, /^Error: not implemented$/)
        })

        await it("flat", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.flat()
            }, /^Error: not implemented$/)
        })

        await it("reverse", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.reverse()
            }, /^Error: not implemented$/)
        })

        await it("sort", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.sort()
            }, /^Error: not implemented$/)
        })

        await it("splice", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                wrapper.list.splice(undefined!)
            }, /^Error: not implemented$/)
        })
    })

    await describe("general", async () => {
        await it("not list throws", async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => wrapper.list, ListRootError)
        })

        await it("empty", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.deepStrictEqual([...wrapper.list], [])
        })

        await it("one item", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.deepStrictEqual([...wrapper.list], ["o1"])
        })

        await it("two items", async () => {
            const rdf = `<s> <p> ( "o1" "o2" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.deepStrictEqual([...wrapper.list], ["o1", "o2"])
        })

        await it("[Symbol.unscopables]", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.deepStrictEqual(wrapper.list[Symbol.unscopables], [][Symbol.unscopables])
        })
    })

    await describe("length", async () => {
        await it("empty is zero", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.strictEqual(wrapper.list.length, 0)
        })

        await it("one is one", async () => {
            const rdf = `<s> <p> ( "o" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.strictEqual(wrapper.list.length, 1)
        })

        await it("set not supported", async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => wrapper.list.length = undefined!)
        })
    })

    await describe("pop", async () => {
        await it("empty undefined", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const actual = wrapper.list.pop()

            assert.strictEqual(actual, undefined)
        })

        await it("one returns last", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const actual = wrapper.list.pop()

            assert.strictEqual(actual, "o1")
        })

        await it("one removes last", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)
            wrapper.list.pop()

            assert.deepStrictEqual([...wrapper.list], [])
        })

        await it("two returns last", async () => {
            const rdf = `<s> <p> ( "o1" "o2" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)
            const popped = wrapper.list.pop()

            assert.strictEqual(popped, "o2")
        })

        await it("two removes last", async () => {
            const rdf = `<s> <p> ( "o1" "o2" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)
            wrapper.list.pop()

            assert.deepStrictEqual([...wrapper.list], ["o1"])
        })
    })

    await describe("push", async () => {
        await it("not list", {skip: "not implemented yet"}, async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.push("o1")
        })

        await it("empty returns new length", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const pushed = wrapper.list.push("o1")

            assert.strictEqual(pushed, 1)
        })

        await it("empty grows", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.push("o1")

            assert.deepStrictEqual([...wrapper.list], ["o1"])
        })

        await it("one returns new length", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const pushed = wrapper.list.push("o2")

            assert.strictEqual(pushed, 2)
        })

        await it("two returns new length", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const pushed = wrapper.list.push("o2", "o3")

            assert.strictEqual(pushed, 3)
        })

        await it("one grows", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.push("o2")

            assert.deepStrictEqual([...wrapper.list], ["o1", "o2"])
        })

        await it("two returns two", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.push("o2", "o3")

            assert.deepStrictEqual([...wrapper.list], ["o1", "o2", "o3"])
        })
    })

    await describe("shift", async () => {
        await it("not list", {skip: "not implemented yet"}, async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.shift()
        })

        await it("empty undefined", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const shifted = wrapper.list.shift()

            assert.strictEqual(shifted, undefined)
        })

        await it("one returns first", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const shifted = wrapper.list.shift()

            assert.strictEqual(shifted, "o1")
        })

        await it("one shrinks", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.shift()

            assert.deepStrictEqual([...wrapper.list], [])
        })

        await it("two returns first", async () => {
            const rdf = `<s> <p> ( "o1" "o2" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const shifted = wrapper.list.shift()

            assert.strictEqual(shifted, "o1")
        })

        await it("two shrinks", async () => {
            const rdf = `<s> <p> ( "o1" "o2" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.shift()

            assert.deepStrictEqual([...wrapper.list], ["o2"])
        })
    })

    await describe("unshift", async () => {
        await it("not list throws", {skip: "not implemented yet"}, async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                return wrapper.list.unshift("o1");
            })
        })

        await it("empty returns new length", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const unshifted = wrapper.list.unshift("o1")

            assert.strictEqual(unshifted, 1)
        })

        await it("empty grows", async () => {
            const rdf = `<s> <p> () .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.unshift("o1")

            assert.deepStrictEqual([...wrapper.list], ["o1"])
        })

        await it("one returns new length", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const unshifted = wrapper.list.unshift("o2")

            assert.strictEqual(unshifted, 2)
        })

        await it("two returns new length", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            const unshifted = wrapper.list.unshift("o2", "o3")

            assert.strictEqual(unshifted, 3)
        })

        await it("one grows", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.unshift("o2")

            assert.deepStrictEqual([...wrapper.list], ["o2", "o1"])
        })

        await it("two grows", async () => {
            const rdf = `<s> <p> ( "o1" ) .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            wrapper.list.unshift("o2", "o3")

            assert.deepStrictEqual([...wrapper.list], ["o2", "o3", "o1"])
        })
    })
})
