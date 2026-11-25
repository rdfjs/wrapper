import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import type { Term } from "@rdfjs/types"
import type { IAsyncTermAsValueMapping, IAsyncTermFromValueMapping, ILangString } from "@rdfjs/wrapper"
import {
    AsyncLiteralAs,
    AsyncOptionalAs,
    AsyncOptionalFrom,
    AsyncRequiredAs,
    AsyncRequiredFrom,
    AsyncSetFrom,
    AsyncTermAs,
    AsyncTermWrapper,
    CardinalityError,
    LiteralDatatypeError,
    LiteralFrom,
    MappingArgumentError,
    TermTypeError
} from "@rdfjs/wrapper"
import { AsyncChild } from "./model/AsyncChild.js"
import { AsyncParent } from "./model/AsyncParent.js"
import { asyncDatasetFromRdf } from "./util/asyncDatasetFromRdf.js"
import { Example } from "./vocabulary/Example.js"

const rdf = `
prefix : <https://example.org/>
prefix xsd: <http://www.w3.org/2001/XMLSchema#>

<x>
    :hasBlankNode _:0 ;
    :hasDate "1969-01-01"^^xsd:date ;
    :hasLangString "lang string 1"@en ;
    :hasNumber 1 ;
    :hasBoolean true ;
    :hasString "string 1" ;
    :hasIri <https://example.org> ;
    :hasTooManySingularString "o3", "o4" ;
    :hasNullableString "o2" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
    :hasLangStringSet "lang string 1"@en, "lang string 2"@fr ;
    :hasChildSet [
        :hasString "child string 2" ;
    ], [
        :hasString "child string 3" ;
    ] ;
    :hasRecursive <x> ;
.
`

function parent() {
    return new AsyncParent("x", asyncDatasetFromRdf(rdf), DataFactory)
}

await describe("Async Term Wrapper", async () => {
    await describe("Wrapper", async () => {
        await it("is an RDF/JS term", async () => {
            const wrapper = parent()

            assert.equal(wrapper.termType, "NamedNode")
            assert.equal(wrapper.value, "x")
            assert.ok(wrapper.equals(DataFactory.namedNode("x")))
            assert.ok(!wrapper.equals(DataFactory.namedNode("y")))
            assert.ok(!wrapper.equals(undefined))
        })

        await it("has a dataset and a factory", async () => {
            const dataset = asyncDatasetFromRdf(rdf)
            const wrapper = new AsyncParent("x", dataset, DataFactory)

            assert.equal(wrapper.dataset, dataset)
            assert.equal(wrapper.factory, DataFactory)
        })

        await it("has a string tag", async () => {
            assert.equal(parent()[Symbol.toStringTag], "AsyncParent")
        })

        await it("wraps literal terms", async () => {
            const term = DataFactory.literal("lang string 1", "en")
            const wrapper = new AsyncTermWrapper(term, asyncDatasetFromRdf(""), DataFactory)

            assert.equal(wrapper.termType, "Literal")
            assert.equal(wrapper.language, "en")
            assert.equal(wrapper.direction, "")
            assert.equal(wrapper.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })

        await it("wraps quad terms", async () => {
            const quad = DataFactory.quad(DataFactory.namedNode("s"), DataFactory.namedNode("p"), DataFactory.namedNode("o"))
            const wrapper = new AsyncTermWrapper(quad as Term, asyncDatasetFromRdf(""), DataFactory)

            assert.equal(wrapper.subject.value, "s")
            assert.equal(wrapper.predicate.value, "p")
            assert.equal(wrapper.object.value, "o")
            assert.equal(wrapper.graph.termType, "DefaultGraph")
        })
    })

    await describe("Value Mapping", async () => {
        await it("get blank node to string", async () => {
            assert.match(await parent().hasBlankNode, /^b\d+_0$/)
        })

        await it("get literal to date", async () => {
            assert.equal((await parent().hasDate).toISOString(), "1969-01-01T00:00:00.000Z")
        })

        await it("get literal to lang string", async () => {
            assert.deepEqual(await parent().hasLangString, {lang: "en", string: "lang string 1"})
        })

        await it("get literal to number", async () => {
            assert.equal(await parent().hasNumber, 1)
        })

        await it("get literal to string", async () => {
            assert.equal(await parent().hasString, "string 1")
        })

        await it("get literal to boolean", async () => {
            assert.equal(await parent().hasBoolean, true)
        })

        await it("get iri to string", async () => {
            assert.equal(await parent().hasIri, "https://example.org")
        })
    })

    await describe("Term Mapping", async () => {
        await it("set string to blank node", async () => {
            const instance = parent()

            await instance.setHasBlankNode("1")
            assert.equal(await instance.hasBlankNode, "1")
        })

        await it("set date to literal", async () => {
            const instance = parent()

            await instance.setHasDate(new Date("1970-01-01"))
            assert.equal((await instance.hasDate).toISOString(), "1970-01-01T00:00:00.000Z")
        })

        await it("set lang string to literal", async () => {
            const instance = parent()
            const langString = {lang: "fr", string: "lang string 2"}

            await instance.setHasLangString(langString)
            assert.deepEqual(await instance.hasLangString, langString)
        })

        await it("set number to literal", async () => {
            const instance = parent()

            await instance.setHasNumber(2)
            assert.equal(await instance.hasNumber, 2)
        })

        await it("set boolean to literal", async () => {
            const instance = parent()

            await instance.setHasBoolean(false)
            assert.equal(await instance.hasBoolean, false)
        })

        await it("set string to literal", async () => {
            const instance = parent()

            await instance.setHasString("string 2")
            assert.equal(await instance.hasString, "string 2")
        })

        await it("set string to iri", async () => {
            const instance = parent()

            await instance.setHasIri("https://example.org/other")
            assert.equal(await instance.hasIri, "https://example.org/other")
        })
    })

    await describe("Object Mapping", async () => {
        await it("get child", async () => {
            const child = await parent().hasChild

            assert.ok(child instanceof AsyncChild)
            assert.equal(await child.hasString, "child string 1")
        })

        await it("set child", async () => {
            const instance = parent()
            const child = new AsyncChild("newChild", instance.dataset, DataFactory)

            await instance.setHasChild(child)
            assert.equal((await instance.hasChild).value, "newChild")
        })

        await it("child writes through to the shared dataset", async () => {
            const instance = parent()
            const child = await instance.hasChild

            await child.setHasString("updated child string")
            assert.equal(await (await instance.hasChild).hasString, "updated child string")
        })
    })

    await describe("Arity Mapping", async () => {
        await it("required with no value rejects with cardinality error", async () => {
            await assert.rejects(parent().hasNoSingularString, (error: unknown) => {
                assert.ok(error instanceof CardinalityError)
                assert.equal(error.found, "none")
                assert.equal(error.predicate, Example.hasNoSingularString)
                assert.equal(error.term.value, "x")

                return true
            })
        })

        await it("required with too many values rejects with cardinality error", async () => {
            await assert.rejects(parent().hasTooManySingularString, (error: unknown) => {
                assert.ok(error instanceof CardinalityError)
                assert.equal(error.found, "multiple")
                assert.equal(error.predicate, Example.hasTooManySingularString)

                return true
            })
        })

        await it("get optional value", async () => {
            assert.equal(await parent().hasNullableString, "o2")
        })

        await it("get missing optional value", async () => {
            const child = new AsyncChild("missing", asyncDatasetFromRdf(""), DataFactory)

            assert.equal(await child.hasString, undefined)
        })

        await it("set optional value", async () => {
            const instance = parent()

            await instance.setHasNullableString("changed")
            assert.equal(await instance.hasNullableString, "changed")
        })

        await it("unset optional value", async () => {
            const instance = parent()

            await instance.setHasNullableString(undefined)
            assert.equal(await instance.hasNullableString, undefined)
        })
    })

    await describe("Set Mapping", async () => {
        await it("iterates values", async () => {
            const strings: (string | undefined)[] = []

            for await (const child of parent().hasChildSet) {
                assert.ok(child instanceof AsyncChild)
                strings.push(await child.hasString)
            }

            assert.deepEqual(strings.sort(), ["child string 2", "child string 3"])
        })

        await it("iterates keys and entries", async () => {
            const set = parent().hasLangStringSet
            const keys: ILangString[] = []
            const entries: [ILangString, ILangString][] = []

            for await (const key of set.keys()) {
                keys.push(key)
            }

            for await (const entry of set.entries()) {
                entries.push(entry)
            }

            assert.equal(keys.length, 2)
            assert.equal(entries.length, 2)
            assert.deepEqual(entries[0], [keys[0], keys[0]])
        })

        await it("visits values with forEach", async () => {
            const set = parent().hasLangStringSet
            const langs: string[] = []

            await set.forEach(item => {
                langs.push(item.lang)
            })

            assert.deepEqual(langs.sort(), ["en", "fr"])
        })

        await it("has size", async () => {
            assert.equal(await parent().hasChildSet.size, 2)
        })

        await it("determines membership", async () => {
            const instance = parent()
            const set = instance.hasLangStringSet

            assert.equal(await set.has({lang: "en", string: "lang string 1"}), true)
            assert.equal(await set.has({lang: "de", string: "lang string 3"}), false)
        })

        await it("adds values", async () => {
            const instance = parent()
            const set = instance.hasLangStringSet

            assert.equal(await set.add({lang: "de", string: "lang string 3"}), set)
            assert.equal(await set.size, 3)
            assert.equal(await set.has({lang: "de", string: "lang string 3"}), true)
        })

        await it("deletes values", async () => {
            const instance = parent()
            const set = instance.hasLangStringSet

            assert.equal(await set.delete({lang: "en", string: "lang string 1"}), true)
            assert.equal(await set.size, 1)
            assert.equal(await set.delete({lang: "en", string: "lang string 1"}), false)
        })

        await it("clears values", async () => {
            const instance = parent()
            const set = instance.hasChildSet

            await set.clear()
            assert.equal(await set.size, 0)
            assert.equal(await instance.hasLangStringSet.size, 2)
        })

        await it("is live", async () => {
            const instance = parent()
            const set = instance.hasLangStringSet

            await instance.hasLangStringSet.add({lang: "de", string: "lang string 3"})
            assert.equal(await set.size, 3)
        })

        await it("has a string tag", async () => {
            assert.equal(parent().hasChildSet[Symbol.toStringTag], "AsyncWrappingSet")
        })
    })

    await describe("Recursion Mapping", async () => {
        await it("get recursive", async () => {
            const instance = parent()
            const recursive = await instance.hasRecursive

            assert.ok(recursive instanceof AsyncParent)
            assert.ok(recursive.equals(instance as Term))
        })

        await it("set recursive", async () => {
            const instance = parent()

            await instance.setHasRecursive(undefined)
            await assert.rejects(instance.hasRecursive, CardinalityError)
        })
    })

    await describe("Literal Value Mapping", async () => {
        const literal = (value: string, datatype: string) =>
            new AsyncTermWrapper(DataFactory.literal(value, DataFactory.namedNode(datatype)), asyncDatasetFromRdf(""), DataFactory)

        await it("maps integer literals to bigints", async () => {
            assert.equal(AsyncLiteralAs.bigint(literal("9007199254740993", "http://www.w3.org/2001/XMLSchema#integer")), 9007199254740993n)
        })

        await it("maps literals to symbols", async () => {
            assert.equal(AsyncLiteralAs.symbol(literal("s", "http://www.w3.org/2001/XMLSchema#string")), Symbol.for("s"))
        })

        await it("maps special numeric literals", async () => {
            assert.equal(AsyncLiteralAs.number(literal("INF", "http://www.w3.org/2001/XMLSchema#double")), Number.POSITIVE_INFINITY)
            assert.equal(AsyncLiteralAs.number(literal("-INF", "http://www.w3.org/2001/XMLSchema#double")), Number.NEGATIVE_INFINITY)
            assert.ok(Number.isNaN(AsyncLiteralAs.number(literal("NaN", "http://www.w3.org/2001/XMLSchema#double"))))
        })

        await it("rejects terms that are not async wrappers", async () => {
            assert.throws(() => AsyncLiteralAs.string(undefined as unknown as AsyncTermWrapper), ReferenceError)
            assert.throws(() => AsyncLiteralAs.string("s" as unknown as AsyncTermWrapper), TypeError)
        })

        await it("rejects terms that are not literals", async () => {
            const iri = new AsyncTermWrapper("s", asyncDatasetFromRdf(""), DataFactory)

            assert.throws(() => AsyncLiteralAs.boolean(iri), TermTypeError)
        })

        await it("rejects literals with unexpected datatypes", async () => {
            assert.throws(() => AsyncLiteralAs.date(literal("1", "http://www.w3.org/2001/XMLSchema#integer")), LiteralDatatypeError)
        })
    })

    await describe("Term Value Mapping", async () => {
        await it("is returns the wrapper itself", async () => {
            const instance = parent()

            assert.equal(AsyncTermAs.is(instance), instance)
        })

        await it("term returns the wrapper as a term", async () => {
            const instance = parent()

            assert.equal(AsyncTermAs.term(instance), instance as Term)
        })

        await it("instance rejects terms that are not async wrappers", async () => {
            const mapping = AsyncTermAs.instance(AsyncChild)

            assert.throws(() => mapping(undefined as unknown as AsyncTermWrapper), ReferenceError)
            assert.throws(() => mapping("s" as unknown as AsyncTermWrapper), TypeError)
        })
    })

    await describe("Mapping Arguments", async () => {
        const undefinedTermAs = undefined as unknown as IAsyncTermAsValueMapping<string>
        const undefinedTermFrom = undefined as unknown as IAsyncTermFromValueMapping<string>

        await it("required from requires a value mapping", async () => {
            await assert.rejects(AsyncRequiredFrom.subjectPredicate(parent(), Example.hasString, undefinedTermAs), (error: unknown) => {
                assert.ok(error instanceof MappingArgumentError)
                assert.equal(error.argument, "termAs")

                return true
            })
        })

        await it("optional from requires a value mapping", async () => {
            await assert.rejects(AsyncOptionalFrom.subjectPredicate(parent(), Example.hasString, undefinedTermAs), MappingArgumentError)
        })

        await it("optional as requires a term mapping", async () => {
            await assert.rejects(AsyncOptionalAs.object(parent(), Example.hasString, "s", undefinedTermFrom), (error: unknown) => {
                assert.ok(error instanceof MappingArgumentError)
                assert.equal(error.argument, "termFrom")

                return true
            })
        })

        await it("required as requires a value", async () => {
            assert.throws(() => AsyncRequiredAs.object(parent(), Example.hasString, undefined as unknown as string, LiteralFrom.string), Error)
        })

        await it("set from requires both mappings", async () => {
            assert.throws(() => AsyncSetFrom.subjectPredicate(parent(), Example.hasChildSet, undefinedTermAs, LiteralFrom.string), MappingArgumentError)
            assert.throws(() => AsyncSetFrom.subjectPredicate(parent(), Example.hasChildSet, AsyncLiteralAs.string, undefinedTermFrom), MappingArgumentError)
        })
    })
})
