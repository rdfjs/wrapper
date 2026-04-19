import { dataFactory } from "./util/dataFactory.js"
import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { Child } from "./model/Child.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { Parent } from "./model/Parent.js"
import type { Term } from "@rdfjs/types"

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
`;


await describe("Term Wrapper", async () => {
    const dataset = datasetFromRdf(rdf)
    const parent = new Parent("x", dataset, dataFactory)

    await describe("Value Mapping", async () => {
        await it("get blank node to string", async () => {
            assert.equal(parent.hasBlankNode, "b0_0")
        })

        await it("get literal to date", async () => {
            assert.equal(parent.hasDate.toISOString(), "1969-01-01T00:00:00.000Z")
        })

        await it("get literal to lang string", async () => {
            assert.deepEqual(parent.hasLangString, {lang: "en", string: "lang string 1"})
        })

        await it("get literal to number", async () => {
            assert.equal(parent.hasNumber, 1)
        })

        await it("get literal to string", async () => {
            assert.equal(parent.hasString, "string 1")
        })

        await it("get literal to boolean", async () => {
            assert.equal(parent.hasBoolean, true)
        })

        await it("get iri to string", async () => {
            assert.equal(parent.hasIri, "https://example.org")
        })
    })

    await describe("Term Mapping", async () => {
        await it("set date to literal", async () => {
            parent.hasDate = new Date("1970-01-01")
            assert.equal(parent.hasDate.toISOString(), "1970-01-01T00:00:00.000Z")
        })

        await it("set lang string to literal", async () => {
            const langString = {lang: "fr", string: "lang string 2"}
            parent.hasLangString = langString
            assert.deepEqual(parent.hasLangString, langString)
        })

        await it("set number to literal", async () => {
            parent.hasNumber = 2
            assert.equal(parent.hasNumber, 2)
        })

        await it("set boolean to literal", async () => {
            parent.hasBoolean = false
            assert.equal(parent.hasBoolean, false)
        })

        await it("set string to blank node", async () => {
            // TODO: Check if this is expected behaviour
            // Does this clash with named node x when matching?
            parent.hasBlankNode = "x"
            assert.equal(parent.hasBlankNode, "x")
        })

        await it("set string to iri", async () => {
            parent.hasIri = "x"
            assert.equal(parent.hasIri, "x")
        })

        await it("set string to literal", async () => {
            parent.hasString = "o1 edited"
            assert.equal(parent.hasString, "o1 edited")
        })
    })

    await describe("Object Mapping", async () => {
        await it("get wrapped term", async () => {
            assert.equal(parent.hasChild.hasString, "child string 1")
        })

        await it("set wrapped term", async () => {
            const newChild = new Child(DataFactory.blankNode(), dataset, dataFactory)
            newChild.hasString = "child string 4"
            parent.hasChild = newChild
            assert.equal(parent.hasChild.hasString, "child string 4")
        })
    })

    await describe("Arity Mapping", async () => {
        await describe("Singular", async () => {
            await it("get singular throws if more than 1", async () => {
                // TODO: Test for specific errors
                assert.throws(() => parent.hasTooManySingularString)
            })

            await it("get singular throws if no value", async () => {
                // TODO: Test for specific errors
                assert.throws(() => parent.hasNoSingularString)
            })

            await it("set singular to undefined throws", async () => {
                assert.throws(() => parent.hasString = undefined as any)
            })
        })

        await describe("Singular Nullable", async () => {
            await it("get nullable", async () => {
                assert.equal(parent.hasNullableString, "o2")
            })

            await it("set nullable to undefined", async () => {
                assert.equal(parent.dataset.size, 20)
                parent.hasNullableString = undefined
                assert.equal(parent.hasNullableString, undefined)
                assert.equal(parent.dataset.size, 19)
            })

            await it("set nullable to string", async () => {
                parent.hasNullableString = "o2 edited"
                assert.equal(parent.hasNullableString, "o2 edited")
            })

            // TODO: Test nullable object
        })

        // TODO: Set Arity
    })

    await describe("Set Mapping", async () => {
        // TODO: test primitive types wrapping set

        await it("get set of lang string", async () => {
            assert.equal(parent.hasLangStringSet.size, 2)
            for (const langString of parent.hasLangStringSet) {
                assert.equal(["en", "fr"].includes(langString.lang), true)
            }
        })

        await it("get set of wrapped terms", async () => {
            assert.equal(parent.hasChildSet.size, 2)
        })

        await it("add to set of wrapped terms", async () => {
            const newChild = new Child(DataFactory.blankNode(), dataset, dataFactory)
            newChild.hasString = "child string 5"
            parent.hasChildSet.add(newChild)
            assert.equal(parent.hasChildSet.size, 3)
        })

        await it("get set of wrapped terms' single literal to string", async () => {
            for (const child of parent.hasChildSet) {
                assert.equal(["child string 2", "child string 3", "child string 5"].includes(child.hasString!), true)
            }
        })
    })


    await describe("Recursion Mapping", async () => {
        await it("get recursive wrapped term", async () => {
            assert.equal(parent.equals(parent.hasRecursive.hasRecursive.hasRecursive as Term), true)
        })

        await it("set recursive property", async () => {
            assert.equal(parent.dataset.size, 22)
            parent.hasRecursive = undefined
            assert.equal(parent.dataset.size, 21)
            // TODO: check for typed error singular no value
            assert.throws(() => parent.hasRecursive)
            parent.hasRecursive = parent
            assert.equal(parent.hasRecursive.hasRecursive.hasRecursive.value, "x")
        })

        // TODO: test recursion in wrapping set
    })
})
