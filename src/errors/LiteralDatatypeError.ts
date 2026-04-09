import { TermError } from "./TermError.js"
import type { Literal } from "@rdfjs/types"

/**
 * Error thrown when the datatype of a literal term is unexpected.
 *
 * Code working with RDF might expect that a term (e.g. the [object of a statement](https://www.w3.org/TR/rdf11-concepts/#dfn-object) is a literal with a specific datatype (e.g. [`xsd:int`](https://www.w3.org/TR/xmlschema-2/#int)). When unmet, code might be strict and throw an error representing the failed expectation.
 *
 * @remarks
 * The {@link TermError.term | underlying error's `term`} is the literal whose datatype was unexpected.
 *
 * @example Trying to map a string to a number
 * Consider the following mapping class, which expects a numeric literal:
 * ```ts
 * class Class extends TermWrapper {
 *     public get property(): number {
 *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.number)
 *     }
 * }
 * ```
 *
 * Given the following RDF, which does not meet the above expectation:
 * ```turtle
 * <s> <p> "o" .
 * ```
 *
 * invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property
 * ```
 *
 * will result in this error being throw.
 *
 * @see
 * - {@link Literal.datatype}
 * - [datatype IRI in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-datatype-iri)
 */
export class LiteralDatatypeError extends TermError {
    /**
     * Creates a new instance of {@link LiteralDatatypeError}.
     *
     * @param literal - The literal associated with this error.
     * @param datatypes - The expected datatypes.
     * @param cause - The specific original cause of the error.
     */
    constructor(literal: Literal, public readonly datatypes: Iterable<string>, cause?: any) {
        super(literal, `Datatype must be one of ${[...datatypes].join()} but was ${literal.datatype}`, cause)
    }
}
