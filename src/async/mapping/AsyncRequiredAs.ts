import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"
import { AsyncOptionalAs } from "./AsyncOptionalAs.js"

/**
 * The asynchronous counterpart of {@link RequiredAs}.
 *
 * @see
 * - {@link RequiredAs}
 * - {@link IAsyncTermFromValueMapping}
 */
export namespace AsyncRequiredAs {
    /**
     * {@link IAsyncTermFromValueMapping | Maps} a JavaScript value that must not be `undefined` to the object of a statement with the anchor term as subject and the given predicate, replacing any previous values.
     *
     * @param anchor - The wrapped term that is the subject of the affected statements.
     * @param p - The IRI of the predicate of the affected statements.
     * @param value - The JavaScript value to map to an object term.
     * @param termFrom - The mapper that converts the JavaScript value to an object term.
     * @returns A promise that resolves once the underlying dataset has been updated.
     *
     * @throws {@link !Error Error} If `value` is `undefined`.
     * @throws {@link MappingArgumentError} If `termFrom` is `undefined`.
     *
     * @example Writing a required property asynchronously
     * The mapping
     * ```ts
     * class Class extends AsyncTermWrapper {
     *     public setProperty(value: string): Promise<void> {
     *         return AsyncRequiredAs.object(this, "p", value, LiteralFrom.string)
     *     }
     * }
     * ```
     *
     * used in the following manner
     * ```ts
     * await new Class("s", asyncDataset, factory).setProperty("o")
     * ```
     *
     * results in the RDF
     * ```turtle
     * <s> <p> "o" .
     * ```
     */
    export function object<T>(anchor: AsyncTermWrapper, p: string, value: T, termFrom: IAsyncTermFromValueMapping<T>): Promise<void> {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        return AsyncOptionalAs.object(anchor, p, value, termFrom)
    }
}
