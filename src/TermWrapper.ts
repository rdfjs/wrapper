import type { BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Term } from "@rdfjs/types"
import { OptionalFrom, LiteralAs, OptionalAs, LiteralFrom } from "./mod.js"

type InferTerm<A> = A extends string ? NamedNode : A extends Term ? A : Term
type IfLiteral<T extends Term, K extends keyof Literal> = T extends Literal ? T[K] : undefined
type IfQuad<T extends Term, K extends keyof BaseQuad> = T extends BaseQuad ? T[K] : undefined

export type TermNode<T extends Term = Term> = TermWrapper<T> & T

export class TermWrapper<T extends Term = Term> {
    private readonly original: T

    public constructor(term: T extends NamedNode ? (string | T) : T, public readonly dataset: DatasetCore, public readonly factory: DataFactory) {
        this.original = (typeof term === "string" ? factory.namedNode(term) : term) as T
    }

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    get termType(): T["termType"] {
        return this.original.termType
    }

    get value(): string {
        return this.original.value
    }

    get language(): IfLiteral<T, "language"> {
        return (this.original as any).language
    }

    get direction(): IfLiteral<T, "direction"> {
        return (this.original as any).direction
    }

    get datatype(): IfLiteral<T, "datatype"> {
        return (this.original as any).datatype
    }

    get subject(): IfQuad<T, "subject"> {
        return (this.original as any).subject
    }

    get predicate(): IfQuad<T, "predicate"> {
        return (this.original as any).predicate
    }

    get object(): IfQuad<T, "object"> {
        return (this.original as any).object
    }

    get graph(): IfQuad<T, "graph"> {
        return (this.original as any).graph
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

    get node(): TermNode<T> {
        return this as any
    }
}
