import { TermError } from "./TermError.js"
import type { Term } from "@rdfjs/types"

/**
 * Error thrown when the number of values found for a predicate violates an expected cardinality of exactly one.
 *
 * Code working with RDF might expect that a [subject](https://www.w3.org/TR/rdf11-concepts/#dfn-subject) has exactly one value for a given [predicate](https://www.w3.org/TR/rdf11-concepts/#dfn-predicate) (e.g. a person having exactly one date of birth). RDF itself imposes no such constraint, so when the data has no value or several values where a singular mapping expects one, code might be strict and throw an error representing the failed expectation.
 *
 * @remarks
 * The {@link TermError.term | underlying error's `term`} is the subject whose values were counted, {@link CardinalityError.predicate | `predicate`} is the IRI of the predicate that was matched and {@link CardinalityError.found | `found`} discriminates between the two possible violations: `"none"` (no value found) and `"multiple"` (more than one value found).
 *
 * @example No value found
 * Consider the following mapping class, which expects exactly one value:
 * ```ts
 * class Class extends TermWrapper {
 *     public get property(): string {
 *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.string)
 *     }
 * }
 * ```
 *
 * Given the following RDF, which has no value for the predicate:
 * ```turtle
 * <s> <q> "o" .
 * ```
 *
 * invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property
 * ```
 *
 * will result in this error being thrown with a `found` of `"none"`.
 *
 * @example More than one value found
 * Consider the same mapping class, given the following RDF, which has two values for the predicate:
 * ```turtle
 * <s> <p> "o1", "o2" .
 * ```
 *
 * invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property
 * ```
 *
 * will result in this error being thrown with a `found` of `"multiple"`.
 *
 * @see
 * - [Triples in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-triples)
 * - [DatasetCore.match](https://rdf.js.org/dataset-spec/#dom-datasetcore-match)
 */
export class CardinalityError extends TermError {
    /**
     * Creates a new instance of {@link CardinalityError}.
     *
     * @param term - The subject term whose values for the predicate violated the expected cardinality.
     * @param predicate - The IRI of the predicate that was matched.
     * @param found - The violating cardinality that was found: `"none"` for no value, `"multiple"` for more than one value.
     * @param cause - The specific original cause of the error.
     */
    constructor(term: Term, public readonly predicate: string, public readonly found: "none" | "multiple", cause?: any) {
        super(term, found === "none"
            ? `No value found for predicate ${predicate} on term ${term.value}`
            : `More than one value for predicate ${predicate} on term ${term.value}`, cause)
    }
}
