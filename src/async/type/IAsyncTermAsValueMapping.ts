import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Represents the function signature of a mapping from a term to some value on the asynchronous surface.
 *
 * Used by this library where lambdas are accepted for translating terms found in asynchronous datasets to arbitrary values chosen by the user.
 *
 * @remarks
 * - This is the asynchronous counterpart of {@link ITermAsValueMapping}. It differs in two ways:
 *   - The term passed in is an {@link AsyncTermWrapper}, so mappings that traverse further into the data (like {@link AsyncTermAs.instance}) hand out models bound to the same asynchronous dataset.
 *   - The mapping may return either the value itself or a {@link Promise} of it. Mappings that only inspect the term (like those in {@link AsyncLiteralAs}) are synchronous, whereas mappings that need to read the dataset return promises. Consumers `await` the result either way.
 * - This library includes an assortment of opinionated mappings from terms to values that adhere to this interface.
 *     They are located in the following namespaces:
 *   - {@link AsyncLiteralAs}
 *   - {@link AsyncTermAs}
 * - While the above mappings can be used anywhere a mapping from term to value is needed, users can also write their own as plain lambdas.
 *
 * @template T - The type of value returned.
 * @param term - The term to be converted.
 * @returns A value that represents the converted term, or a {@link Promise} of it.
 *
 * @example Using a built-in mapping
 * It is expected that in most cases the easiest way to convert between RDF terms and native values is by referencing one of the existing mapping functions like {@link AsyncLiteralAs.number}:
 * ```ts
 * class Person extends AsyncTermWrapper {
 *   get age(): Promise<number> {
 *     return AsyncRequiredFrom.subjectPredicate(this, "age", AsyncLiteralAs.number) // 3rd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Using an inline lambda
 * Mapping can also be expressed as a lambda:
 * ```ts
 * class Person extends AsyncTermWrapper {
 *   get age(): Promise<number> {
 *     return AsyncRequiredFrom.subjectPredicate(this, "age", term => Number(term.value)) // 3rd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Mapping as TypeScript typed constant
 * Authoring mappings as typed TypeScript constants helps by compile-time checking that a lambda adheres to the interface.
 * ```ts
 * const termValue: IAsyncTermAsValueMapping<string> = term => term.value
 * ```
 *
 * @see
 * - {@link ITermAsValueMapping}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export interface IAsyncTermAsValueMapping<T> {
    (term: AsyncTermWrapper): T | Promise<T>
}
