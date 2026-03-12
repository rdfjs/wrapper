import type { IAnyTerm } from "./type/IAnyTerm.js"
import type { BaseQuad, Literal, NamedNode, Term } from "@rdfjs/types"

export abstract class AnyTerm implements IAnyTerm {
    protected constructor(private readonly original: Term) {
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
        return this.original.equals(other);
    }
}
