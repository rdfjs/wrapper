import { describe, it } from "node:test"
import { DataFactory, Literal } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { ObjectMapping, TermMapping, TermWrapper, ValueMapping } from "rdfjs-wrapper"
import assert from "node:assert"

describe("tojson", () => {
    it("1", () => {
        class Wrapper extends TermWrapper {
            get p(): string | undefined {
                return this.singularNullable("p", ValueMapping.literalToString)
            }
        }

        const rdf = ``
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {})
    })

    it("2", () => {
        class Wrapper extends TermWrapper {
            get p(): string | undefined {
                return this.singularNullable("p", ValueMapping.literalToString)
            }
        }

        const rdf = `<s> <other> "value" .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {})
    })

    it("3", () => {
        class Wrapper extends TermWrapper {
            get p(): string {
                return this.singular("p", ValueMapping.literalToString)
            }
        }

        const rdf = `<s> <p> "o" .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: "o"})
    })

    it("3.1", () => {
        class Wrapper extends TermWrapper {
            get p1(): string {
                return this.singular("p1", ValueMapping.literalToString)
            }

            get p2(): Wrapper | undefined {
                return this.singularNullable("p2", ObjectMapping.as(Wrapper))
            }
        }

        const rdf = `
<s>
    <p1> "o1" ;
    <p2> [
        <p1> "o2" ;
    ] ;
.`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p1: "o1", p2: {p1: "o2"}})
    })

    it("3.2", () => {
        class Wrapper extends TermWrapper {
            get name(): string {
                return this.singular("name", ValueMapping.literalToString)
            }

            get child(): Wrapper | undefined {
                return this.singularNullable("child", ObjectMapping.as(Wrapper))
            }

            get child2(): Wrapper | undefined {
                return this.singularNullable("child2", ObjectMapping.as(Wrapper))
            }
        }

        const rdf = `
<s1>
    <name> "o1" ;
    <child> <s2> ;
    <child2> <s3> ;
.

<s2>
    <name> "o2" ;
    <child> <s3> ;
.

<s3>
    <name> "o3" ;
.
`
        const wrapper = new Wrapper("s1", datasetFromRdf(rdf), DataFactory)

        const seen: Array<{ equals: (other: any) => boolean }> = []
        const stringified = JSON.stringify(wrapper, function (this: any, key: string, current: any) {
            console.log(seen)
            if (current !== undefined && current["equals"] !== undefined) {
                if (seen.some(previous => previous.equals(current))) {
                    return "CYCLE"
                }

                seen.push(current)
            }

            return current
        })

        assert.deepStrictEqual(JSON.parse(stringified),
            {
                name: "o1",
                child: {
                    name: "o2",
                    child: {
                        name: "o3",
                    }
                },
                child2: {
                    name: "o3",
                }
            })
    })

    it("4", () => {
        class Wrapper extends TermWrapper {
            get p(): Set<string> {
                return this.objects("p", ValueMapping.literalToString, TermMapping.stringToLiteral)
            }
        }

        const rdf = ``
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: []})
    })

    it("5", () => {
        class Wrapper extends TermWrapper {
            get p(): Set<string> {
                return this.objects("p", ValueMapping.literalToString, TermMapping.stringToLiteral)
            }
        }

        const rdf = `<s> <p> "o1", "o2" .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: ["o1", "o2"]})
    })

    it("5.1", () => {
        class Wrapper extends TermWrapper {
            get p1(): string {
                return this.singular("p1", ValueMapping.literalToString)
            }

            get p2(): Set<Wrapper> {
                return this.objects("p2", ObjectMapping.as(Wrapper), ObjectMapping.as(Wrapper))
            }
        }

        const rdf = `
<s>
    <p1> "o1" ;
    <p2> [
        <p1> "o2" ;
    ] ;
.`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p1: "o1", p2: [{p1: "o2", p2: []}]})
    })

    it("6", () => {
        class Wrapper extends TermWrapper {
            get p(): string[] {
                return this.singular("p", ObjectMapping.asList(this, "p", ValueMapping.literalToString, TermMapping.stringToLiteral))
            }
        }

        const rdf = `<s> <p> () .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: []})
    })

    it("7", () => {
        class Wrapper extends TermWrapper {
            get p(): string[] {
                return this.singular("p", ObjectMapping.asList(this, "p", ValueMapping.literalToString, TermMapping.stringToLiteral))
            }
        }

        const rdf = `<s> <p> ( "o1" "o2" ) .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: ["o1", "o2"]})
    })

    it("7.1", () => {
        class Wrapper extends TermWrapper {
            get p1(): string {
                return this.singular("p1", ValueMapping.literalToString)
            }

            get p2(): Wrapper[] | undefined {
                return this.singularNullable("p2", ObjectMapping.asList(this, "p2", ObjectMapping.as(Wrapper), ObjectMapping.as(Wrapper)))
            }
        }

        const rdf = `
<s>
    <p1> "o1" ;
    <p2> ([
        <p1> "o2" ;
    ]) ;
.`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p1: "o1", p2: [{p1: "o2"}]})
    })

    it("8", () => {
        class Wrapper extends TermWrapper {
            public get p(): Map<string, string> {
                return this.map(
                    "p",
                    ({term}) => [
                        (term as Literal).language,
                        (term as Literal).value
                    ],
                    ([key, value], dataset, factory) =>
                        new TermWrapper(factory.literal(value, key), dataset, factory)
                )
            }
        }

        const rdf = `<s> <p> "o1"@en, "o2"@fr .`
        const wrapper = new Wrapper("s", datasetFromRdf(rdf), DataFactory)

        assert.deepStrictEqual(JSON.parse(JSON.stringify(wrapper)), {p: {"en": "o1", "fr": "o2"}})
    })
})
