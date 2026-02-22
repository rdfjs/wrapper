import type { BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Term } from '@rdfjs/types'

type TermType = Term["termType"]

interface AnyTerm {
    readonly termType: TermType
    readonly value: string
    readonly language: string
    readonly direction: "ltr" | "rtl" | "" | null | undefined
    readonly datatype: NamedNode
    readonly subject: Term
    readonly predicate: Term
    readonly object: Term
    readonly graph: Term

    equals(other: Term | null | undefined): boolean
}

abstract class WrapperTerm implements AnyTerm {
    protected constructor(private readonly original: Term) {
    }

    get termType(): TermType {
        return this.original.termType
    }

    get value(): string {
        return this.original.value
    }

    get language(): string {
        return (this.original as Literal).language
    }

    get direction(): "ltr" | "rtl" | "" | null | undefined {
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

export abstract class Something extends WrapperTerm {
    public readonly dataset: DatasetCore;
    public readonly factory: DataFactory;

    public constructor(term: string, dataset: DatasetCore, factory: DataFactory);
    public constructor(term: Term, dataset: DatasetCore, factory: DataFactory);
    public constructor(term: string | Term, dataset: DatasetCore, factory: DataFactory) {
        super(typeof term === "string" ? factory.namedNode(term) : term)

        this.dataset = dataset;
        this.factory = factory;
    }
}
