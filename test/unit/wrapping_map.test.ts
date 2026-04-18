import { describe, it } from "node:test"
import { Mapping, TermWrapper } from "@rdfjs/wrapper"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import assert from "node:assert"

class Wrapper extends TermWrapper {
    public get dict(): Map<string, string> {
        return Mapping.languageDictionary(this, "p")
    }
}

await describe("Wrapping map", async () => {
    await describe("size", async () => {
        await it("get", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@hu, "o3"@he .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.strictEqual(wrapper.dict.size, 3)
        })

        await it("set not supported", async () => {
            const rdf = `<s> <p> <o> .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.throws(() => {
                (wrapper.dict as any)["size"] = undefined!
            }, /^Error: not supported$/)
        })
    })

    await describe("general", async () => {
        await it("get", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

            assert.strictEqual(wrapper.dict.get("en"), "o1")
            assert.strictEqual(wrapper.dict.get("fr"), "o2")
        })

        await it("clear", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            wrapper.dict.clear()

            assert.strictEqual(dataset.size, 0)
        })

        await it("delete reports positive", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            assert.strictEqual(wrapper.dict.delete("en"), true)
        })

        await it("delete reports negative", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            assert.strictEqual(wrapper.dict.delete("XX"), false)
        })

        await it("delete deletes", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            wrapper.dict.delete("en")

            assert.strictEqual(wrapper.dict.has("en"), false)
        })

        await it("delete reports negative", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            wrapper.dict.delete("XX")

            assert.strictEqual(wrapper.dict.has("en"), true)
            assert.strictEqual(wrapper.dict.has("fr"), true)
        })

        await it("forEach", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            const actual = {} as any
            wrapper.dict.forEach((value, key) => {
                actual[key] = value
            })

            assert.deepStrictEqual(actual, {en: "o1", fr: "o2"})
        })

        await it("set", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            wrapper.dict.set("en", "ox")

            assert.deepStrictEqual(wrapper.dict.get("en"), "ox")
        })

        await it("keys", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            assert.deepStrictEqual([...wrapper.dict.keys()], ["en", "fr"])
        })

        await it("values", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            assert.deepStrictEqual([...wrapper.dict.values()], ["o1", "o2"])
        })

        await it("toStringTag", async () => {
            const rdf = `<s> <p> "o1"@en, "o2"@fr .`
            const dataset = datasetFromRdf(rdf)
            const wrapper = new Wrapper("s", dataset, DataFactory)

            assert.strictEqual(wrapper.dict.toString(), "[object WrappingMap]")
        })
    })
})
