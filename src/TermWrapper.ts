import type { BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Term } from "@rdfjs/types"
import type { IAnyTerm } from "./type/IAnyTerm.js"

type InferTerm<A> = A extends string ? NamedNode : A extends Term ? A : Term

export class TermWrapper<T extends Term = Term> implements IAnyTerm {
    private readonly original: T

    public constructor(term: T extends NamedNode ? (string | T) : T, public readonly dataset: DatasetCore, public readonly factory: DataFactory) {
        this.original = (typeof term === "string" ? factory.namedNode(term) : term) as T
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

    public static from<
        This extends abstract new (...args: any[]) => TermWrapper,
        A extends ConstructorParameters<This>[0]
    >(this: This, term: A, dataset: DatasetCore, factory: DataFactory): InstanceType<This> & InferTerm<A> {
        return new (this as any)(term, dataset, factory) as InstanceType<This> & InferTerm<A>
    }

    public static in<This extends abstract new (...args: any[]) => TermWrapper>(
        this: This, dataset: DatasetCore, factory: DataFactory
    ): <A extends ConstructorParameters<This>[0]>(term: A) => InstanceType<This> & InferTerm<A> {
        return (term) => new (this as any)(term, dataset, factory) as any
    }
}
