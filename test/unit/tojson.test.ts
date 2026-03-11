import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { ObjectMapping, TermMapping, TermWrapper, ValueMapping } from "rdfjs-wrapper"
import assert from "node:assert"
import { Term } from "@rdfjs/types";

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

        const seen: Array<Term> = []
        const stringified = JSON.stringify(wrapper, function (this: any, key: string, current: any) {
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

    it("X", () => {
        class T {
            constructor(public readonly name: string, public child?: T) {
            }

            equals(other: T): boolean {
                return other.name === this.name
            }
        }

        const data = new T("1")
        data.child = data

        console.log("-----------------------")


        const seen = []
        const path = new TermSet

        console.log(
            JSON.stringify(data, function (this: any, key: string, value: any) {
                if (key === "") return value
                path.add(this)
                if (path.has(value)) {
                    return "CYCLE"
                }
                // seen.push(this)
                console.log(this.name, key, value.name)
                return value
            }))
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
                    ({language, value}) => [
                        language,
                        value
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

class TermSet implements Set<Term> {
    private readonly thing: Term[] = []

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    get size(): number {
        return this.thing.length
    }

    [Symbol.iterator](): SetIterator<Term> {
        return this.values()
    }

    add(value: Term): this {
        if (!this.has(value)) {
            this.thing.push(value)
        }

        return this
    }

    clear(): void {
        this.thing.length = 0
    }

    delete(value: Term): boolean {
        for (let i = 0; i < this.thing.length; i++) {
            const t = this.thing[i]!
            if (t.equals(value)) {
                this.thing.splice(i, 1)

                return true
            }
        }

        return false
    }

    * entries(): SetIterator<[Term, Term]> {
        for (const term of this) {
            yield [term, term]
        }
    }

    forEach(callbackfn: (value: Term, value2: Term, set: Set<Term>) => void, thisArg?: any): void {
        for (const term of thisArg) {
            callbackfn.call(thisArg, term, term, this)
        }
    }

    has(value: Term): boolean {
        for (let i = 0; i < this.thing.length; i++) {
            const t = this.thing[i]!
            if (t.equals(value)) {
                return true
            }
        }

        return false
    }

    keys(): SetIterator<Term> {
        return this.values()
    }

    values(): SetIterator<Term> {
        return this.thing[Symbol.iterator]()
    }
}

class TermMap<T> implements Map<Term, T> {
    private thing: T[] = []
    private keyTerms = new TermSet

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    get size(): number {
        return this.thing.length
    }

    [Symbol.iterator](): MapIterator<[Term, T]> {
        return this.entries()
    }

    clear(): void {
        this.keyTerms.clear()
        this.thing.length = 0
    }

    delete(key: Term): boolean {
        throw new Error("Not implemented")
    }

    * entries(): MapIterator<[Term, T]> {
        let i = 0;
        for (const keyTerm of this.keyTerms) {
            yield [keyTerm, this.thing[i++]!]
        }
    }

    forEach(callbackfn: (value: T, key: Term, map: Map<Term, T>) => void, thisArg?: any): void {
        for (const [key, value] of thisArg) {
            callbackfn.call(thisArg, value, key, this)
        }
    }

    get(key: Term): T | undefined {
        let i = 0;
        for (const keyTerm of this.keyTerms) {
            if (keyTerm.equals(key)) {
                return this.thing[i]
            }

            i++
        }

        return undefined
    }

    has(key: Term): boolean {
        return this.keyTerms.has(key)
    }

    keys(): MapIterator<Term> {
        return this.keyTerms[Symbol.iterator]()
    }

    set(key: Term, value: T): this {
        if (!this.has(key)) {
            this.keyTerms.add(key)
        }

        let i = 0;
        for (const keyTerm of this.keyTerms) {
            if (keyTerm.equals(key)) {
                break
            }
            i++
        }

        this.thing[i] = value

        return this
    }

    values(): MapIterator<T> {
        return this.thing[Symbol.iterator]()
    }
}
