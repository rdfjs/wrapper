import assert from "node:assert"
import { describe, it } from "node:test"
import { DataFactory } from "n3"
import { TermWrapper, type TermNode } from "@rdfjs/wrapper"
import type { BlankNode, Literal, NamedNode } from "@rdfjs/types"
import { datasetFromRdf } from "./util/datasetFromRdf.js"

const rdf = `
prefix xsd: <http://www.w3.org/2001/XMLSchema#>
<s> <p> "hello"@en .
`

await describe("Term-specific property visibility", async () => {
    const dataset = datasetFromRdf(rdf)

    await describe("Literal properties are available when term is Literal", async () => {
        await it("language, direction, datatype exist at runtime and in types", () => {
            const literal = DataFactory.literal("hello", "en")
            const node = TermWrapper.from(literal, dataset, DataFactory)
            assert.equal(node.language, "en")
            assert.equal(node.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })
    })

    await describe("Quad properties are available when term is Quad", async () => {
        await it("subject, predicate, object, graph exist at runtime and in types", () => {
            const quad = DataFactory.quad(
                DataFactory.namedNode("s"),
                DataFactory.namedNode("p"),
                DataFactory.literal("o"),
            )
            const node = TermWrapper.from(quad, dataset, DataFactory)
            assert.equal(node.subject.value, "s")
            assert.equal(node.predicate.value, "p")
            assert.equal(node.object.value, "o")
        })
    })

    await describe("Literal properties are NOT on NamedNode", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            // @ts-expect-error language does not exist on NamedNode
            void node.language
            // @ts-expect-error direction does not exist on NamedNode
            void node.direction
            // @ts-expect-error datatype does not exist on NamedNode
            void node.datatype
        })
    })

    await describe("Literal properties are NOT on BlankNode", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            // @ts-expect-error language does not exist on BlankNode
            void node.language
            // @ts-expect-error direction does not exist on BlankNode
            void node.direction
            // @ts-expect-error datatype does not exist on BlankNode
            void node.datatype
        })
    })

    await describe("Literal properties are NOT on DefaultGraph", async () => {
        await it("language, direction, datatype are not available", () => {
            const node = TermWrapper.from(DataFactory.defaultGraph(), dataset, DataFactory)
            // @ts-expect-error language does not exist on DefaultGraph
            void node.language
            // @ts-expect-error direction does not exist on DefaultGraph
            void node.direction
            // @ts-expect-error datatype does not exist on DefaultGraph
            void node.datatype
        })
    })

    await describe("Quad properties are NOT on NamedNode", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            // @ts-expect-error subject does not exist on NamedNode
            void node.subject
            // @ts-expect-error predicate does not exist on NamedNode
            void node.predicate
            // @ts-expect-error object does not exist on NamedNode
            void node.object
            // @ts-expect-error graph does not exist on NamedNode
            void node.graph
        })
    })

    await describe("Quad properties are NOT on Literal", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory)
            // @ts-expect-error subject does not exist on Literal
            void node.subject
            // @ts-expect-error predicate does not exist on Literal
            void node.predicate
            // @ts-expect-error object does not exist on Literal
            void node.object
            // @ts-expect-error graph does not exist on Literal
            void node.graph
        })
    })

    await describe("Quad properties are NOT on BlankNode", async () => {
        await it("subject, predicate, object, graph are not available", () => {
            const node = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            // @ts-expect-error subject does not exist on BlankNode
            void node.subject
            // @ts-expect-error predicate does not exist on BlankNode
            void node.predicate
            // @ts-expect-error object does not exist on BlankNode
            void node.object
            // @ts-expect-error graph does not exist on BlankNode
            void node.graph
        })
    })

    await describe("Common properties are always available", async () => {
        await it("termType and value exist on NamedNode", () => {
            const node = TermWrapper.from("x", dataset, DataFactory)
            assert.equal(typeof node.termType, "string")
            assert.equal(typeof node.value, "string")
            assert.equal(typeof node.equals, "function")
        })

        await it("termType and value exist on Literal", () => {
            const node = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory)
            assert.equal(typeof node.termType, "string")
            assert.equal(typeof node.value, "string")
            assert.equal(typeof node.equals, "function")
        })
    })

    await describe("Implementation-specific properties are not carried through", async () => {
        await it("N3 NamedNode has toJSON but wrapper does not", () => {
            const n3Term = DataFactory.namedNode("x")
            assert.equal(typeof (n3Term as any).toJSON, "function")
            const node = TermWrapper.from("x", dataset, DataFactory)
            // @ts-expect-error toJSON is an N3 implementation detail, not part of RDF/JS interfaces
            void node.toJSON
            assert.equal((node as any).toJSON, undefined)
        })

        await it("N3 Literal has toJSON but wrapper does not", () => {
            const n3Term = DataFactory.literal("hello")
            assert.equal(typeof (n3Term as any).toJSON, "function")
            const node = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory)
            // @ts-expect-error toJSON is an N3 implementation detail, not part of RDF/JS interfaces
            void node.toJSON
            assert.equal((node as any).toJSON, undefined)
        })

        await it("N3 BlankNode has toJSON but wrapper does not", () => {
            const n3Term = DataFactory.blankNode()
            assert.equal(typeof (n3Term as any).toJSON, "function")
            const node = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            // @ts-expect-error toJSON is an N3 implementation detail, not part of RDF/JS interfaces
            void node.toJSON
            assert.equal((node as any).toJSON, undefined)
        })

        await it("N3 Quad has toJSON but wrapper does not", () => {
            const n3Term = DataFactory.quad(DataFactory.namedNode("s"), DataFactory.namedNode("p"), DataFactory.literal("o"))
            assert.equal(typeof (n3Term as any).toJSON, "function")
            const node = TermWrapper.from(n3Term, dataset, DataFactory)
            // @ts-expect-error toJSON is an N3 implementation detail, not part of RDF/JS interfaces
            void node.toJSON
            assert.equal((node as any).toJSON, undefined)
        })
    })

    await describe("Explicit type annotations are assignable", async () => {
        await it("TermNode<Literal> from Literal", () => {
            const node: TermNode<Literal> = TermWrapper.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
            assert.equal(node.language, "en")
            assert.equal(node.termType, "Literal")
        })

        await it("TermNode<NamedNode> from string", () => {
            const node: TermNode<NamedNode> = TermWrapper.from("x", dataset, DataFactory)
            assert.equal(node.termType, "NamedNode")
            assert.equal(node.value, "x")
        })

        await it("TermNode<BlankNode> from BlankNode", () => {
            const node: TermNode<BlankNode> = TermWrapper.from(DataFactory.blankNode(), dataset, DataFactory)
            assert.equal(node.termType, "BlankNode")
        })
    })

    await describe("node getter", async () => {
        await it("returns the wrapper itself", () => {
            const wrapper = TermWrapper.from("x", dataset, DataFactory)
            assert.strictEqual(wrapper.node, wrapper)
        })

        await it("preserves NamedNode properties", () => {
            const wrapper = TermWrapper.from("x", dataset, DataFactory)
            const node = wrapper.node
            assert.equal(node.termType, "NamedNode")
            assert.equal(node.value, "x")
        })

        await it("preserves Literal properties", () => {
            const wrapper = TermWrapper.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
            const node = wrapper.node
            assert.equal(node.language, "en")
            assert.equal(node.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
        })

        await it("Literal properties are NOT available on NamedNode node", () => {
            const wrapper = TermWrapper.from("x", dataset, DataFactory)
            const node = wrapper.node
            // @ts-expect-error language does not exist on NamedNode
            void node.language
            // @ts-expect-error datatype does not exist on NamedNode
            void node.datatype
        })

        await it("is assignable to TermNode<T>", () => {
            const namedNode: TermNode<NamedNode> = TermWrapper.from("x", dataset, DataFactory).node
            assert.equal(namedNode.termType, "NamedNode")

            const literal: TermNode<Literal> = TermWrapper.from(DataFactory.literal("hello"), dataset, DataFactory).node
            assert.equal(literal.termType, "Literal")
        })

        await it("preserves subclass type (Person.node has Person properties)", () => {
            class Person extends TermWrapper {
                get name(): string {
                    return "test"
                }
            }
            const person = Person.from("x", dataset, DataFactory)
            const node = person.node
            assert.equal(node.name, "test")
            assert.equal(node.termType, "NamedNode")
            assert.equal(node.value, "x")
        })

        await it("preserves subclass type with Literal", () => {
            class Person extends TermWrapper {
                get name(): string {
                    return "test"
                }
            }
            const person = Person.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
            const node = person.node
            assert.equal(node.name, "test")
            assert.equal(node.language, "en")
        })

        await it("subclass node is assignable to the subclass type", () => {
            class Person extends TermWrapper {
                get name(): string {
                    return "test"
                }
            }
            const person = Person.from("x", dataset, DataFactory)
            const p: Person = person.node
            assert.equal(p.name, "test")
        })

        await it("subclass node does not have wrong term-specific properties", () => {
            class Person extends TermWrapper {
                get name(): string {
                    return "test"
                }
            }
            const person = Person.from("x", dataset, DataFactory)
            const node = person.node
            // @ts-expect-error language does not exist on Person & NamedNode
            void node.language
            // @ts-expect-error subject does not exist on Person & NamedNode
            void node.subject
            // custom property is still available
            assert.equal(node.name, "test")
        })
    })

    await describe("Subclass (Person extends TermWrapper)", async () => {
        class Person extends TermWrapper {
            get name(): string {
                return "test"
            }
        }

        await describe("from infers correct type", async () => {
            await it("Person.from with string returns Person & NamedNode", () => {
                const person = Person.from("x", dataset, DataFactory)
                assert.equal(person.termType, "NamedNode")
                assert.equal(person.value, "x")
                assert.equal(person.name, "test")
            })

            await it("Person.from with Literal returns Person & Literal", () => {
                const person = Person.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
                assert.equal(person.language, "en")
                assert.equal(person.name, "test")
            })

            await it("Person.from with BlankNode returns Person & BlankNode", () => {
                const person = Person.from(DataFactory.blankNode(), dataset, DataFactory)
                assert.equal(person.termType, "BlankNode")
                assert.equal(person.name, "test")
            })
        })

        await describe("in factory infers correct type", async () => {
            await it("Person.in returns function that produces Person & NamedNode", () => {
                const createPerson = Person.in(dataset, DataFactory)
                const person = createPerson("x")
                assert.equal(person.termType, "NamedNode")
                assert.equal(person.name, "test")
            })
        })

        await describe("Literal properties are NOT on subclass with NamedNode", async () => {
            await it("language, direction, datatype are not available", () => {
                const person = Person.from("x", dataset, DataFactory)
                // @ts-expect-error language does not exist on Person & NamedNode
                void person.language
                // @ts-expect-error direction does not exist on Person & NamedNode
                void person.direction
                // @ts-expect-error datatype does not exist on Person & NamedNode
                void person.datatype
            })
        })

        await describe("Quad properties are NOT on subclass with NamedNode", async () => {
            await it("subject, predicate, object, graph are not available", () => {
                const person = Person.from("x", dataset, DataFactory)
                // @ts-expect-error subject does not exist on Person & NamedNode
                void person.subject
                // @ts-expect-error predicate does not exist on Person & NamedNode
                void person.predicate
                // @ts-expect-error object does not exist on Person & NamedNode
                void person.object
                // @ts-expect-error graph does not exist on Person & NamedNode
                void person.graph
            })
        })

        await describe("Literal properties ARE available on subclass with Literal", async () => {
            await it("language, datatype exist", () => {
                const person = Person.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
                assert.equal(person.language, "en")
                assert.equal(person.datatype.value, "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString")
                assert.equal(person.name, "test")
            })
        })

        await describe("Subclass custom properties are always available", async () => {
            await it("name exists on Person from string", () => {
                const person = Person.from("x", dataset, DataFactory)
                assert.equal(person.name, "test")
            })

            await it("name exists on Person from Literal", () => {
                const person = Person.from(DataFactory.literal("hello"), dataset, DataFactory)
                assert.equal(person.name, "test")
            })

            await it("name exists on Person from BlankNode", () => {
                const person = Person.from(DataFactory.blankNode(), dataset, DataFactory)
                assert.equal(person.name, "test")
            })
        })

        await describe("Explicit type annotations are assignable for subclass", async () => {
            await it("Person & NamedNode from string", () => {
                const person: Person & NamedNode = Person.from("x", dataset, DataFactory)
                assert.equal(person.termType, "NamedNode")
                assert.equal(person.name, "test")
            })

            await it("Person & Literal from Literal", () => {
                const person: Person & Literal = Person.from(DataFactory.literal("hello", "en"), dataset, DataFactory)
                assert.equal(person.language, "en")
                assert.equal(person.name, "test")
            })

            await it("Person & BlankNode from BlankNode", () => {
                const person: Person & BlankNode = Person.from(DataFactory.blankNode(), dataset, DataFactory)
                assert.equal(person.termType, "BlankNode")
                assert.equal(person.name, "test")
            })

            await it("TermNode<NamedNode> from Person.from with string", () => {
                const person: TermNode<NamedNode> = Person.from("x", dataset, DataFactory)
                assert.equal(person.termType, "NamedNode")
            })

            await it("TermNode<Literal> from Person.from with Literal", () => {
                const person: TermNode<Literal> = Person.from(DataFactory.literal("hello"), dataset, DataFactory)
                assert.equal(person.termType, "Literal")
            })

            await it("TermNode<BlankNode> from Person.from with BlankNode", () => {
                const person: TermNode<BlankNode> = Person.from(DataFactory.blankNode(), dataset, DataFactory)
                assert.equal(person.termType, "BlankNode")
            })
        })
    })
})
