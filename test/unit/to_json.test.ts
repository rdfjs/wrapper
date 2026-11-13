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
    })

})
