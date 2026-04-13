import type { Literal, NamedNode, Quad, Term } from "@rdfjs/types"

export interface IRdfJsTerm {
    /**
     * @see {@link Term.termType}
     * @group Implementation of RDF/JS Term
     */
    readonly termType: Term["termType"]

    /**
     * @see {@link Term.value}
     * @group Implementation of RDF/JS Term
     */
    readonly value: string

    /**
     * @see {@link Literal.language}
     * @group Implementation of RDF/JS Term
     */
    readonly language: string

    /**
     * @see {@link Literal.direction}
     * @group Implementation of RDF/JS Term
     */
    readonly direction: Literal["direction"]

    /**
     * @see {@link Literal.datatype}
     * @group Implementation of RDF/JS Term
     */
    readonly datatype: NamedNode

    /**
     * @see {@link Quad.subject}
     * @group Implementation of RDF/JS Term
     */
    readonly subject: Term

    /**
     * @see {@link Quad.predicate}
     * @group Implementation of RDF/JS Term
     */
    readonly predicate: Term

    /**
     * @see {@link Quad.object}
     * @group Implementation of RDF/JS Term
     */
    readonly object: Term

    /**
     * @see {@link Quad.graph}
     * @group Implementation of RDF/JS Term
     */
    readonly graph: Term

    /**
     * @see {@link Term.equals}
     * @group Implementation of RDF/JS Term
     */
    equals(other: Term | null | undefined): boolean
}
