import type { DataFactory, DatasetCore, NamedNode, Term } from "@rdfjs/types"
import { OptionalFrom, LiteralAs, OptionalAs, LiteralFrom } from "./mod.js"

type InferTerm<A> = A extends string ? NamedNode : A extends Term ? A : Term

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

for (const prop of ['language', 'direction', 'datatype', 'subject', 'predicate', 'object', 'graph'] as const) {
    Object.defineProperty(TermWrapper.prototype, prop, {
        get(this: TermWrapper) { return (this as any).original[prop] },
        enumerable: true,
        configurable: true,
    })
}
