import type { DataFactory, Term } from "@rdfjs/types"

/**
 * Represents the function signature of a mapping from some value to a term.
 *
 * Used by this library where lambdas are accepted for translating arbitrary values chosen by the user to terms.
 *
 * @remarks
 * - This library includes an assortment of opinionated mappings from values to terms that adhere to this interface.
 *     They are located in the following namespaces:
 *   - {@link BlankNodeFrom}
 *   - {@link LiteralFrom}
 *   - {@link NamedNodeFrom}
 *   - {@link SetFrom}
 *   - {@link TermFrom}
 * - While the above mappings can be used anywhere a mapping from value to term is needed, users can also write their own as plain lambdas.
 * - No restrictions are imposed on the type or content of the value parameter accepted by these mapping functions except for the understanding that they return terms that represent the value in some way that is meaningful for the user in some circumstances.
 *
 * @template T - The type of value accepted.
 * @param value - The value to be converted.
 * @param factory - A collection of methods for creating terms.
 * @returns A term that represents the converted value.
 *
 * @example Using a built-in mapping
 * It is expected that in most cases the easiest way to convert between RDF terms and native values is by referencing
 *     one of the existing mapping functions like {@link LiteralAs.number}:
 * ```ts
 * class Person extends TermWrapper {
 *   set age(value: number) {
 *     return RequiredAs.object(this. "age", LiteralFrom.number) // 2nd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Using an inline lambda
 * Mapping can also be expressed as a lambda ([function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function) or [arrow function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)):
 * ```ts
 * class Person extends TermWrapper {
 *   set age(value: number) {
 *     return RequiredAs.object(this. "age", (value, factory) => factory.literal(value.toString(), factory.namedNode(XSD.double))) // 2nd param is the mapping
 *   }
 * }
 * ```
 *
 * @example Mapping as TypeScript function
 * ```ts
 * function term(value: string, factory: DataFactory): Term {
 *   return factory.literal(value)
 * }
 * ```
 *
 * @example Mapping as JavaScript function
 * ```js
 * function term(value, factory) {
 *   return factory.literal(value)
 * }
 * ```
 *
 * @example Mapping as TypeScript typed constant
 * Authoring mappings as typed TypoedScript constants helps by compile-time checking that a lambda adheres to the
 * interface.
 * ```ts
 * const termValue: ITermFromValueMapping<string> = (value, factory) => factory.literal(value)
 * ```
 */
export interface ITermFromValueMapping<T> {
    (value: T, factory: DataFactory): Term
}
