import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { LiteralAs, LiteralFrom, Mapping, OptionalFrom, SetFrom, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import assert from "node:assert"
import type { DatasetCore, Term } from "@rdfjs/types"

function wrap<T>(model: new (term: string, dataset: DatasetCore, factory: typeof DataFactory) => T, rdf: string, iri = "s"): T {
    return new model(iri, datasetFromRdf(rdf), DataFactory)
}

function parsedJson(value: unknown): unknown {
    return JSON.parse(JSON.stringify(value))
}

const circularStructureError = {name: "TypeError", message: "Converting circular structure to JSON"}

describe("JSON serialization", () => {
    describe("TermWrapper", () => {
        class Person extends TermWrapper {
            get name(): string | undefined {
                return OptionalFrom.subjectPredicate(this, "name", LiteralAs.string)
            }

            get friend(): Person | undefined {
                return OptionalFrom.subjectPredicate(this, "friend", TermAs.instance(Person))
            }
        }

        it("serializes each getter of the class as a property", () => {
            const person = wrap(Person, `<s> <name> "Alice" .`)

            const json = JSON.stringify(person)

            assert.strictEqual(json, `{"name":"Alice"}`)
        })

        it("omits a getter that returns undefined", () => {
            const person = wrap(Person, `<s> <unrelated> "value" .`)

            const json = JSON.stringify(person)

            assert.strictEqual(json, `{}`)
        })

        it("serializes a wrapper returned by a getter as a nested object", () => {
            const person = wrap(Person, `
<s> <name> "Alice" ; <friend> <bob> .
<bob> <name> "Bob" .
`)

            const json = JSON.stringify(person)

            assert.strictEqual(json, `{"name":"Alice","friend":{"name":"Bob"}}`)
        })

        it("does not serialize the members of TermWrapper itself", () => {
            const wrapper = wrap(TermWrapper, `<s> <name> "Alice" .`)

            const json = JSON.stringify(wrapper)

            assert.strictEqual(json, `{}`)
        })

        it("serializes only getters that have a string key", () => {
            class Mixed extends TermWrapper {
                field = "field"

                static get staticGetter(): string {
                    return "static getter"
                }

                get getter(): string {
                    return "getter"
                }

                get [Symbol.for("symbol")](): string {
                    return "symbol getter"
                }

                set setter(_: string) {
                }

                method(): string {
                    return "method"
                }
            }
            const wrapper = wrap(Mixed, ``)

            const json = JSON.stringify(wrapper)

            assert.strictEqual(json, `{"getter":"getter"}`)
        })

        it("puts the getters of a base class before the getters of a derived class", () => {
            class Base extends TermWrapper {
                get z(): number {
                    return 1
                }

                get y(): number {
                    return 2
                }
            }

            class Derived extends Base {
                get a(): number {
                    return 3
                }
            }
            const wrapper = wrap(Derived, ``)

            const json = JSON.stringify(wrapper)

            assert.strictEqual(json, `{"z":1,"y":2,"a":3}`)
        })

        it("reads an overridden getter once and keeps it at the position of the base class", () => {
            let reads = 0

            class Base extends TermWrapper {
                get first(): string {
                    return "base"
                }

                get second(): string {
                    return "base"
                }
            }

            class Derived extends Base {
                get third(): string {
                    return "derived"
                }

                override get first(): string {
                    reads++
                    return "derived"
                }
            }
            const wrapper = wrap(Derived, ``)

            const json = JSON.stringify(wrapper)

            assert.strictEqual(json, `{"first":"derived","second":"base","third":"derived"}`)
            assert.strictEqual(reads, 1)
        })

        it("serializes a getter named __proto__ as an ordinary property", () => {
            class Wrapper extends TermWrapper {
                get __proto__(): string {
                    return "value"
                }
            }
            const wrapper = wrap(Wrapper, ``)

            const json = JSON.stringify(wrapper)

            assert.strictEqual(json, `{"__proto__":"value"}`)
        })

        it("leaves a value that has its own toJSON to JSON.stringify", () => {
            class Event extends TermWrapper {
                get date(): Date | undefined {
                    return OptionalFrom.subjectPredicate(this, "date", LiteralAs.date)
                }
            }
            const event = wrap(Event, `<s> <date> "2020-01-01T00:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`)

            const json = JSON.stringify(event)

            assert.strictEqual(json, `{"date":"2020-01-01T00:00:00.000Z"}`)
        })

        it("lets an error thrown by a getter propagate", () => {
            const error = new Error("getter failed")

            class Wrapper extends TermWrapper {
                get broken(): string {
                    throw error
                }
            }
            const wrapper = wrap(Wrapper, ``)

            const act = () => JSON.stringify(wrapper)

            assert.throws(act, error)
        })

        it("returns a shallow plain object when toJSON is called directly", () => {
            const person = wrap(Person, `
<s> <name> "Alice" ; <friend> <bob> .
<bob> <name> "Bob" .
`)

            const result = person.toJSON()

            assert.strictEqual(Object.getPrototypeOf(result), Object.prototype)
            assert.deepStrictEqual(Object.keys(result), ["name", "friend"])
            assert.strictEqual(result.name, "Alice")
            assert.ok(result.friend instanceof Person)
        })
    })

    describe("WrappingSet", () => {
        class Tagged extends TermWrapper {
            get tags(): Set<string> {
                return SetFrom.subjectPredicate(this, "tags", LiteralAs.string, LiteralFrom.string)
            }
        }

        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get children(): Set<Node> {
                return SetFrom.subjectPredicate(this, "children", TermAs.instance(Node), TermFrom.instance)
            }
        }

        it("serializes as an array of its items", () => {
            const tagged = wrap(Tagged, `<s> <tags> "one", "two" .`)

            const json = JSON.stringify(tagged.tags)

            assert.strictEqual(json, `["one","two"]`)
        })

        it("serializes as an empty array if it has no items", () => {
            const tagged = wrap(Tagged, ``)

            const json = JSON.stringify(tagged.tags)

            assert.strictEqual(json, `[]`)
        })

        it("serializes items that are wrappers as objects", () => {
            const node = wrap(Node, `<a> <children> <b> .`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {id: "a", children: [{id: "b", children: []}]})
        })

        it("serializes a node that two items share in full for each item", () => {
            const node = wrap(Node, `
<a> <children> <b>, <c> .
<b> <children> <shared> .
<c> <children> <shared> .
`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {
                id: "a",
                children: [
                    {id: "b", children: [{id: "shared", children: []}]},
                    {id: "c", children: [{id: "shared", children: []}]},
                ],
            })
        })

        it("throws if an item is one of its own ancestors", () => {
            const node = wrap(Node, `
<a> <children> <b> .
<b> <children> <a> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })
    })

    describe("RdfList", () => {
        class Tagged extends TermWrapper {
            get tags(): string[] | undefined {
                return OptionalFrom.subjectPredicate(this, "tags", TermAs.list(this, "tags", LiteralAs.string, LiteralFrom.string))
            }
        }

        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get children(): Node[] | undefined {
                return OptionalFrom.subjectPredicate(this, "children", TermAs.list(this, "children", TermAs.instance(Node), TermFrom.instance))
            }
        }

        it("serializes as an array of its items", () => {
            const tagged = wrap(Tagged, `<s> <tags> ( "one" "two" ) .`)

            const json = JSON.stringify(tagged.tags)

            assert.strictEqual(json, `["one","two"]`)
        })

        it("serializes as an empty array if it has no items", () => {
            const tagged = wrap(Tagged, `<s> <tags> () .`)

            const json = JSON.stringify(tagged.tags)

            assert.strictEqual(json, `[]`)
        })

        it("serializes items that are wrappers as objects", () => {
            const node = wrap(Node, `<a> <children> ( <b> ) .`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {id: "a", children: [{id: "b"}]})
        })

        it("serializes a node that two items share in full for each item", () => {
            const node = wrap(Node, `
<a> <children> ( <b> <c> ) .
<b> <children> ( <shared> ) .
<c> <children> ( <shared> ) .
`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {
                id: "a",
                children: [
                    {id: "b", children: [{id: "shared"}]},
                    {id: "c", children: [{id: "shared"}]},
                ],
            })
        })

        it("throws if an item is one of its own ancestors", () => {
            const node = wrap(Node, `
<a> <children> ( <b> ) .
<b> <children> ( <a> ) .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })
    })

    describe("WrappingMap", () => {
        class Labelled extends TermWrapper {
            get labels(): Map<string, string> {
                return Mapping.languageDictionary(this, "labels", LiteralAs.langTuple, LiteralFrom.langTuple)
            }

            get labelsByLength(): Map<number, string> {
                return Mapping.languageDictionary(this, "labels", term => [term.value.length, term.value], ([, value]) => DataFactory.literal(value))
            }
        }

        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get children(): Map<string, Node> {
                return Mapping.languageDictionary(this, "children", term => [term.value, new Node(term as Term, term.dataset, term.factory)], ([, value]) => value as Term)
            }
        }

        it("serializes as an object with a property for each entry", () => {
            const labelled = wrap(Labelled, `<s> <labels> "one"@en, "un"@fr .`)

            const json = JSON.stringify(labelled.labels)

            assert.strictEqual(json, `{"en":"one","fr":"un"}`)
        })

        it("serializes as an empty object if it has no entries", () => {
            const labelled = wrap(Labelled, ``)

            const json = JSON.stringify(labelled.labels)

            assert.strictEqual(json, `{}`)
        })

        it("converts keys that are not strings to property names", () => {
            const labelled = wrap(Labelled, `<s> <labels> "one"@en, "un"@fr .`)

            const json = JSON.stringify(labelled.labelsByLength)

            assert.strictEqual(json, `{"2":"un","3":"one"}`)
        })

        it("serializes values that are wrappers as objects", () => {
            const node = wrap(Node, `<a> <children> <b> .`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {id: "a", children: {b: {id: "b", children: {}}}})
        })

        it("serializes a node that two values share in full for each value", () => {
            const node = wrap(Node, `
<a> <children> <b>, <c> .
<b> <children> <shared> .
<c> <children> <shared> .
`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {
                id: "a",
                children: {
                    b: {id: "b", children: {shared: {id: "shared", children: {}}}},
                    c: {id: "c", children: {shared: {id: "shared", children: {}}}},
                },
            })
        })

        it("throws if a value is one of its own ancestors", () => {
            const node = wrap(Node, `
<a> <children> <b> .
<b> <children> <a> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })
    })

    describe("native array returned by a getter", () => {
        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get children(): Node[] {
                return [...SetFrom.subjectPredicate(this, "children", TermAs.instance(Node), TermFrom.instance)]
            }
        }

        class NestedNode extends TermWrapper {
            get children(): NestedNode[][] {
                return [[...SetFrom.subjectPredicate(this, "children", TermAs.instance(NestedNode), TermFrom.instance)]]
            }
        }

        it("serializes a node that two elements share in full for each element", () => {
            const node = wrap(Node, `
<a> <children> <b>, <c> .
<b> <children> <shared> .
<c> <children> <shared> .
`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {
                id: "a",
                children: [
                    {id: "b", children: [{id: "shared", children: []}]},
                    {id: "c", children: [{id: "shared", children: []}]},
                ],
            })
        })

        it("throws if an element is one of its own ancestors", () => {
            const node = wrap(Node, `
<a> <children> <b> .
<b> <children> <a> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })

        it("throws if an element of a nested array is one of its own ancestors", () => {
            const node = wrap(NestedNode, `
<a> <children> <b> .
<b> <children> <a> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })
    })

    describe("shared and circular nodes", () => {
        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get child(): Node | undefined {
                return OptionalFrom.subjectPredicate(this, "child", TermAs.instance(Node))
            }

            get otherChild(): Node | undefined {
                return OptionalFrom.subjectPredicate(this, "otherChild", TermAs.instance(Node))
            }
        }

        it("serializes a node that two branches share in full in each branch", () => {
            const node = wrap(Node, `
<a> <child> <b> ; <otherChild> <shared> .
<b> <child> <shared> .
`, "a")

            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {
                id: "a",
                child: {id: "b", child: {id: "shared"}},
                otherChild: {id: "shared"},
            })
        })

        it("throws if a node is its own child", () => {
            const node = wrap(Node, `<a> <child> <a> .`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })

        it("throws if a node is one of its own descendants", () => {
            const node = wrap(Node, `
<a> <child> <b> .
<b> <child> <c> .
<c> <child> <a> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })

        it("throws if the cycle does not include the root", () => {
            const node = wrap(Node, `
<a> <child> <b> .
<b> <child> <c> .
<c> <child> <b> .
`, "a")

            const act = () => JSON.stringify(node)

            assert.throws(act, circularStructureError)
        })

        it("serializes the same wrapper after the cycle that made it throw is removed", () => {
            const dataset = datasetFromRdf(`
<a> <child> <b> .
<b> <child> <a> .
`)
            const node = new Node("a", dataset, DataFactory)
            const closingQuad = DataFactory.quad(DataFactory.namedNode("b"), DataFactory.namedNode("child"), DataFactory.namedNode("a"))

            assert.throws(() => JSON.stringify(node), circularStructureError)
            dataset.delete(closingQuad)
            const actual = parsedJson(node)

            assert.deepStrictEqual(actual, {id: "a", child: {id: "b"}})
        })
    })

    describe("arguments of JSON.stringify", () => {
        class Node extends TermWrapper {
            get id(): string {
                return this.value
            }

            get child(): Node | undefined {
                return OptionalFrom.subjectPredicate(this, "child", TermAs.instance(Node))
            }
        }

        it("indents the output as the space argument specifies", () => {
            const node = wrap(Node, `<a> <child> <b> .`, "a")

            const json = JSON.stringify(node, null, 2)

            assert.strictEqual(json, JSON.stringify({id: "a", child: {id: "b"}}, null, 2))
        })

        it("keeps only the properties that a replacer array lists", () => {
            const node = wrap(Node, `<a> <child> <b> .`, "a")

            const json = JSON.stringify(node, ["id"])

            assert.strictEqual(json, `{"id":"a"}`)
        })

        it("serializes the value that a replacer function returns", () => {
            const node = wrap(Node, `<a> <child> <b> .`, "a")

            const json = JSON.stringify(node, (key, value) => key === "child" ? "replaced" : value)

            assert.strictEqual(json, `{"id":"a","child":"replaced"}`)
        })

        it("gives a replacer function the original wrapper as this[key] and the plain object as value", () => {
            const node = wrap(Node, `<a> <child> <b> .`, "a")
            let original: unknown
            let converted: unknown

            JSON.stringify(node, function (this: any, key: string, value: unknown) {
                if (key === "child" && value !== undefined) {
                    original = this[key]
                    converted = value
                }

                return value
            })

            assert.ok(original instanceof Node)
            assert.strictEqual(Object.getPrototypeOf(converted), Object.prototype)
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
