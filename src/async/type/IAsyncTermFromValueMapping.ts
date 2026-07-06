import type { DataFactory, Term } from "@rdfjs/types"

/**
 * Represents the function signature of a mapping from some value to a term on the asynchronous surface.
 *
 * Used by this library where lambdas are accepted for translating arbitrary values chosen by the user to terms destined for asynchronous datasets.
 *
 * @remarks
 * - Term creation is pure and never needs to touch the dataset, so this signature is synchronous - identical to its synchronous counterpart {@link ITermFromValueMapping} - and exists for symmetry with {@link IAsyncTermAsValueMapping}.
 * - Because the signatures are identical, the existing synchronous mappers ({@link BlankNodeFrom}, {@link LiteralFrom}, {@link NamedNodeFrom} and {@link TermFrom}) can be used directly wherever a mapping of this type is accepted.
 *
 * @template T - The type of value accepted.
 * @param value - The value to be converted.
 * @param factory - A collection of methods for creating terms.
 * @returns A term that represents the converted value.
 *
 * @example Using a built-in synchronous mapping
 * ```ts
 * class Person extends AsyncTermWrapper {
 *   setAge(value: number): Promise<void> {
 *     return AsyncRequiredAs.object(this, "age", value, LiteralFrom.double) // 4th param is the mapping
 *   }
 * }
 * ```
 *
 * @example Mapping as TypeScript typed constant
 * Authoring mappings as typed TypeScript constants helps by compile-time checking that a lambda adheres to the interface.
 * ```ts
 * const termValue: IAsyncTermFromValueMapping<string> = (value, factory) => factory.literal(value)
 * ```
 *
 * @see
 * - {@link ITermFromValueMapping}
 */
export interface IAsyncTermFromValueMapping<T> {
    (value: T, factory: DataFactory): Term
}
