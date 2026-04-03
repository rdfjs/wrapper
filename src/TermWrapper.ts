import type { BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Term } from "@rdfjs/types"
import type { IAnyTerm } from "./type/IAnyTerm.js"

export class TermWrapper implements IAnyTerm {
    private readonly original: Term

    public constructor(term: string, dataset: DatasetCore, factory: DataFactory)
    public constructor(term: Term, dataset: DatasetCore, factory: DataFactory)
    public constructor(term: string | Term, public readonly dataset: DatasetCore, public readonly factory: DataFactory) {
        this.original = typeof term === "string" ? factory.namedNode(term) : term
    }

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    get termType(): Term["termType"] {
        return this.original.termType
    }

    get value(): string {
        return this.original.value
    }

    get language(): string {
        return (this.original as Literal).language
    }

    get direction(): Literal["direction"] {
        return (this.original as Literal).direction
    }

    get datatype(): NamedNode {
        return (this.original as Literal).datatype
    }

    get subject(): Term {
        return (this.original as BaseQuad).subject
    }

    get predicate(): Term {
        return (this.original as BaseQuad).predicate
    }

    get object(): Term {
        return (this.original as BaseQuad).object
    }

    get graph(): Term {
        return (this.original as BaseQuad).graph
    }

    equals(other: Term | null | undefined): boolean {
        return this.original.equals(other)
    }
}
