import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { datasetFromRdf } from "./util/datasetFromRdf.js"
import { LiteralAs, OptionalFrom, TermAs, TermWrapper } from "@rdfjs/wrapper"
import assert from "node:assert"
import type { DatasetCore } from "@rdfjs/types"

function wrap<T>(model: new (term: string, dataset: DatasetCore, factory: typeof DataFactory) => T, rdf: string, iri = "s"): T {
    return new model(iri, datasetFromRdf(rdf), DataFactory)
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

})
