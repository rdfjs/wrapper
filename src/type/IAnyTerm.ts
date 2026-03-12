import type { Literal, NamedNode, Term } from "@rdfjs/types"

export interface IAnyTerm {
    readonly termType: Term["termType"]
    readonly value: string
    readonly language: string
    readonly direction: Literal["direction"]
    readonly datatype: NamedNode
    readonly subject: Term
    readonly predicate: Term
    readonly object: Term
    readonly graph: Term

    equals(other: Term | null | undefined): boolean
}
