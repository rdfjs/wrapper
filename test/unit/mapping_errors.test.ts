import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import {
    LiteralAs,
    LiteralFrom,
    Mapping,
    MappingArgumentError,
    OptionalAs,
    OptionalFrom,
    RequiredFrom,
    SetFrom,
    TermWrapper
} from "@rdfjs/wrapper"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { Example } from "./vocabulary/Example.js"

const rdf = `
prefix : <https://example.org/>

<x> :hasString "string 1" .
`

await describe("Mapping Errors", async () => {
    const dataset = datasetFromRdf(rdf)
    const wrapper = new TermWrapper("x", dataset, DataFactory)
    const undefinedMapper = undefined as any

    function assertMappingArgumentError(argument: string) {
        return (error: unknown) => {
            assert.ok(error instanceof MappingArgumentError)
            assert.equal(error.argument, argument)
            return true
        }
    }

    await describe("RequiredFrom", async () => {
        await it("throws if termAs is undefined", async () => {
            assert.throws(() => RequiredFrom.subjectPredicate(wrapper, Example.hasString, undefinedMapper), assertMappingArgumentError("termAs"))
        })
    })

    await describe("OptionalFrom", async () => {
        await it("throws if termAs is undefined", async () => {
            assert.throws(() => OptionalFrom.subjectPredicate(wrapper, Example.hasString, undefinedMapper), assertMappingArgumentError("termAs"))
        })
    })

    await describe("OptionalAs", async () => {
        await it("throws if termFrom is undefined", async () => {
            assert.throws(() => OptionalAs.object(wrapper, Example.hasString, "value", undefinedMapper), assertMappingArgumentError("termFrom"))
        })
    })

    await describe("SetFrom", async () => {
        await it("throws if termAs is undefined", async () => {
            assert.throws(() => SetFrom.subjectPredicate(wrapper, Example.hasString, undefinedMapper, LiteralFrom.string), assertMappingArgumentError("termAs"))
        })

        await it("throws if termFrom is undefined", async () => {
            assert.throws(() => SetFrom.subjectPredicate(wrapper, Example.hasString, LiteralAs.string, undefinedMapper), assertMappingArgumentError("termFrom"))
        })
    })

    await describe("Mapping", async () => {
        await it("throws if termAs is undefined", async () => {
            assert.throws(() => Mapping.languageDictionary(wrapper, Example.hasString, undefinedMapper, undefinedMapper), assertMappingArgumentError("termAs"))
        })

        await it("throws if termFrom is undefined", async () => {
            assert.throws(() => Mapping.languageDictionary(wrapper, Example.hasString, LiteralAs.langString as any, undefinedMapper), assertMappingArgumentError("termFrom"))
        })
    })
})
