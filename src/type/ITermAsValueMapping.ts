import type { TermWrapper } from "../TermWrapper.js"
import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"

/**
 * Represents the function signature of a mapping from a term to some value.
 *
 * Used by this library where lambdas are accepted for translating terms to arbitrary values chosen by the user.
 *
 * @remarks
 * - This library includes an assortment of opinionated mappings from terms to values that adhere to this interface.
 *     They are located in the following namespaces:
 *   - {@link LiteralAs}
 *   - {@link NamedNodeAs}
 *   - {@link TermAs}
 * - While the above mappings can be used anywhere a mapping from term to value is needed, users can also write their own as plain lambdas.
 * - The parameter passed to mapping functions of this type is an abstraction introduced in this library instead of a {@link Term}. This is so the term serving as context for conversion also carries
 *   - a reference to the {@link DatasetCore} that contains the term, which can be used to extract further information, as well as
 *   - a {@link DataFactory} that can be used to create terms.
 * - No restrictions are imposed on the type or content of values returned from these mapping functions except for the understanding that they represent the term in some way that is meaningful for the user in some circumstances.
 *
 * @template T - The type of value returned.
 * @param term - The term to be converted.
 * @returns A value that represents the converted term.
 *
 * @example Using a built-in mapping
 * It is expected that in most cases the easiest way to convert between RDF terms and native values is by referencing one of the existing mapping functions like {@link LiteralAs.number}:
 * ```ts
 * class Person extends TermWrapper {
 *   get age(): number {
 *     return RequiredFrom.subjectPredicate(this. "age", LiteralAs.number) // 2nd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Using an inline lambda
 * Mapping can also be expressed as a lambda ([function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function) or [arrow function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)):
 * ```ts
 * class Person extends TermWrapper {
 *   get age(): number {
 *     return RequiredFrom.subjectPredicate(this. "age", term => Number(term.value)) // 2nd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Mapping as TypeScript function
 * ```ts
 * function termValue(term: TermWrapper): string {
 *   return term.value
 * }
 * ```
 *
 * @example Mapping as JavaScript function
 * ```js
 * function termValue(term) {
 *   return term.value
 * }
 * ```
 *
 * @example Mapping as TypeScript typed constant
 * Authoring mappings as typed TypoedScript constants helps by compile-time checking that a lambda adheres to the interface.
 * ```ts
 * const termValue: ITermAsValueMapping<string> = term => term.value
 * ```
 *
 * @see
 * - {@link Term}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export interface ITermAsValueMapping<T> {
    (term: TermWrapper): T
}
