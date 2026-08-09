import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { ParentDataset } from "./model/ParentDataset.js"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { Example } from "./vocabulary/Example.js"

const rdf = `
prefix : <https://example.org/>

<x>
    a :Parent ;
    :hasString "o1" ;
    :hasChild [
        :hasString "child string 1" ;
    ] ;
    :hasChildSet [
        :hasString "child string 2" ;
    ], [
        :hasString "child string 3" ;
    ] ;
.
<y>
    :hasString "o2" ;
    :hasChild <z> ;
.
<z>
    :hasString "child string 4" ;
.
`;


await describe("Dataset Wrappers", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdf), DataFactory)

    await it("get instances of Parent as Parent", async () => {
        assert.equal(Array.from(parentDataset.instancesOfParent).length, 1)

        for (const parent of parentDataset.instancesOfParent) {
            assert.equal("o1", parent.hasString)
        }
    })

    await it("get subjects of hasChild as Parent instances", async () => {
        assert.equal(Array.from(parentDataset.subjectsOfHasChild).length, 2)

        for (const parent of parentDataset.subjectsOfHasChild) {
            assert.equal(true, ["o1", "o2"].includes(parent.hasString!))
        }
    })

    await it("get objects of hasChild as Child instances", async () => {
        assert.equal((Array.from(parentDataset.objectsOfHasChild).length), 2)

        for (const child of parentDataset.objectsOfHasChild) {
            assert.equal(["child string 1", "child string 4"].includes(child.hasString!), true)
        }
    })

    await it("get matching subjects of `?s ?p :Parent ?g` as Parent instances", async () => {
        assert.equal((Array.from(parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany).length), 1)

        for (const parent of parentDataset.matchSubjectsOfPropertyanyObjectparentGraphany) {
            assert.equal("o1", parent.hasString)
        }
    })

    await it("get matching objects of `<x> :hasChild ?o ?g` as Child instances", async () => {
        assert.equal((Array.from(parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany).length), 1)

        for (const child of parentDataset.matchObjectsOfSubjectxPropertyhaschildGraphany) {
            assert.equal("child string 1", child.hasString)
        }
    })

    await it("iterates", async () => {
        assert.equal((Array.from(parentDataset).length), 11)

        for (const x of parentDataset) {
            assert.equal(x.equals(x), true)
        }
    })
})

const rdfWithDuplicates = `
prefix : <https://example.org/>

<s>
    a :Parent ;
    :hasString "s" ;
    :hasChild <c1>, <c2> ;
    :hasLangString "chat"@en, "chat"@fr ;
.
<s2>
    :hasString "s2" ;
    :hasChild <c1> ;
    :hasLangString "chat"@en ;
.
<c1> :hasString "c1" .
<c2> :hasString "c2" .

<g> {
    <s> a :Parent .
}
`;


await describe("Dataset Wrappers yield distinct terms", async () => {
    const parentDataset = new ParentDataset(datasetFromRdf(rdfWithDuplicates), DataFactory)

    await it("get instances of Parent once despite duplicate rdf:type paths", async () => {
        const parents = Array.from(parentDataset.instancesOfParent)

        assert.equal(parents.length, 1)
        assert.equal(parents[0]!.hasString, "s")
    })

    await it("get subjects of hasChild once despite multiple matching quads", async () => {
        const parents = Array.from(parentDataset.subjectsOfHasChild)

        assert.equal(parents.length, 2)
        assert.deepStrictEqual(parents.map(parent => parent.hasString).sort(), ["s", "s2"])
    })

    await it("get objects of hasChild once despite multiple matching quads", async () => {
        const children = Array.from(parentDataset.objectsOfHasChild)

        assert.equal(children.length, 2)
        assert.deepStrictEqual(children.map(child => child.hasString).sort(), ["c1", "c2"])
    })

    await it("keeps objects that are literals differing only in language", async () => {
        const strings = Array.from(parentDataset.objectsOfHasLangString)

        assert.equal(strings.length, 2)
        assert.deepStrictEqual(strings.map(string => string.language).sort(), ["en", "fr"])
    })

    await it("get subjects of hasChild once when the subject is a quoted triple", async () => {
        const { namedNode, quad } = DataFactory
        const quoted = quad(namedNode("s"), namedNode("p"), namedNode("o"))
        const dataset = datasetFromRdf("")
        dataset.add(quad(quoted, namedNode(Example.hasChild), namedNode("c1")))
        dataset.add(quad(quoted, namedNode(Example.hasChild), namedNode("c2")))

        const parents = Array.from(new ParentDataset(dataset, DataFactory).subjectsOfHasChild)

        assert.equal(parents.length, 1)
    })
})
