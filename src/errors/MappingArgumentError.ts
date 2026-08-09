import { WrapperError } from "./WrapperError.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"

/**
 * Error thrown when a mapping function is invoked without a required mapping argument.
 *
 * The mapping functions of this library (e.g. `RequiredFrom.subjectPredicate`) delegate conversion between RDF terms and JavaScript values to mapper arguments: {@link ITermAsValueMapping | `termAs` mappers} read (RDF to JavaScript) and {@link ITermFromValueMapping | `termFrom` mappers} write (JavaScript to RDF). Passing `undefined` instead of a mapper is a mistake in the mapping class, which this error reports eagerly and by name, instead of letting the mapping fail later with an unrelated error.
 *
 * @remarks
 * The {@link MappingArgumentError.argument | `argument`} property is the name of the parameter that was `undefined` (e.g. `"termAs"` or `"termFrom"`).
 *
 * A common way to hit this error from JavaScript (where there is no compiler to catch it) is referencing a misspelt or nonexistent member of a mapper collection like `LiteralAs`, which evaluates to `undefined`.
 *
 * @example Passing an undefined value mapper
 * Consider the following mapping class, which references a nonexistent member of `LiteralAs`:
 * ```ts
 * class Class extends TermWrapper {
 *     public get property(): string {
 *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.strin) // typo: not a member of LiteralAs
 *     }
 * }
 * ```
 *
 * Given any RDF, for example:
 * ```turtle
 * <s> <p> "o" .
 * ```
 *
 * invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property
 * ```
 *
 * will result in this error being thrown with an `argument` of `"termAs"`.
 *
 * @example Passing an undefined term mapper
 * Consider the following mapping class, which passes `undefined` where a `termFrom` mapper is expected:
 * ```ts
 * class Class extends TermWrapper {
 *     public set property(value: string) {
 *         OptionalAs.object(this, "p", value, undefined)
 *     }
 * }
 * ```
 *
 * Invoking the mapping code in the following manner:
 * ```ts
 * new Class("s", dataset, factory).property = "o"
 * ```
 *
 * will result in this error being thrown with an `argument` of `"termFrom"`.
 *
 * @see
 * - {@link ITermAsValueMapping}
 * - {@link ITermFromValueMapping}
 */
export class MappingArgumentError extends WrapperError {
    /**
     * Creates a new instance of {@link MappingArgumentError}.
     *
     * @param argument - The name of the mapping parameter that was `undefined`.
     * @param cause - The specific original cause of the error.
     */
    constructor(public readonly argument: string, cause?: any) {
        super(`Argument ${argument} must be a mapping function but was undefined`, cause)
    }
}
