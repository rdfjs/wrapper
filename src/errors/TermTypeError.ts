import { TermError } from "./TermError.js"
import type { Term } from "@rdfjs/types"

/**
 * Error thrown when the type of a term is unexpected.
 *
 * Code working with RDF might expect that a term (e.g. the [object of a
 * statement](https://www.w3.org/TR/rdf11-concepts/#dfn-object) is of a specific term type (e.g. `Literal`}). When unmet, code might be strict and throw an error representing the failed expectation.
 *
 * @remarks
 * The {@link TermError.term | underlying error's `term`} is the one whose type was unexpected.
 *
 * @example Trying to map a named node to a number
 * Consider the following mapping class, which expects a numeric literal:
 * ```ts
 * class Class extends TermWrapper {
 *     public get property(): number {
 *         return RequiredFrom.subjectPredicate(this.node, "p", LiteralAs.number)
 *     }
 * }
 * ```
 *
 * Given the following RDF, which does not meet the above expectation:
 * ```turtle
 * <s> <p> <o> .
 * ```
 *
 * Invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property
 * ```
 *
 * Will result in this error being throw with the following message.
 *
 * @see
 * - [Term.termType](https://rdf.js.org/data-model-spec/#dom-term-termtype)
 */
export class TermTypeError extends TermError {
    /**
     * Creates a new instance of {@link TermTypeError}.
     *
     * @param term - The term associated with this error.
     * @param termType - The expected term type.
     * @param cause - The specific original cause of the error.
     */
    constructor(term: Term, public readonly termType: Term["termType"], cause?: any) {
        super(term, `Term type must be ${termType} but was ${term.termType}`, cause)
    }
}
