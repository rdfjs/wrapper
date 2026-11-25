import { MappingArgumentError } from "../../errors/MappingArgumentError.js"
import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import { AsyncWrappingSet } from "../AsyncWrappingSet.js"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"

/**
 * The asynchronous counterpart of {@link SetFrom}: a collection of {@link IAsyncTermFromValueMapping | mappers} that expose RDF/JS graph patterns in asynchronous datasets as mutable, asynchronously iterable sets.
 *
 * @see
 * - {@link SetFrom}
 */
export namespace AsyncSetFrom {
    /**
     * {@link IAsyncTermAsValueMapping | Maps} the objects of statements with the anchor term as subject and the given predicate to a mutable, asynchronously iterable set of JavaScript values.
     *
     * @param anchor - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts object terms to JavaScript values.
     * @param termFrom - The mapper that converts JavaScript values to object terms.
     * @returns A mutable set backed by the underlying asynchronous dataset.
     *
     * @throws {@link MappingArgumentError} If `termAs` or `termFrom` is `undefined`.
     *
     * @example Mapping a set of statements asynchronously
     * The RDF
     * ```turtle
     * <s> <p> "o1", "o2" .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends AsyncTermWrapper {
     *     public get property(): AsyncWrappingSet<string> {
     *         return AsyncSetFrom.subjectPredicate(this, "p", AsyncLiteralAs.string, LiteralFrom.string)
     *     }
     * }
     * ```
     *
     * so that
     * ```ts
     * for await (const value of new Class("s", asyncDataset, factory).property) {
     *     console.log(value)
     * }
     * ```
     *
     * prints `o1` and `o2`.
     */
    export function subjectPredicate<T>(anchor: AsyncTermWrapper, p: string, termAs: IAsyncTermAsValueMapping<T>, termFrom: IAsyncTermFromValueMapping<T>): AsyncWrappingSet<T> {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        if (termFrom === undefined) {
            throw new MappingArgumentError("termFrom")
        }

        return new AsyncWrappingSet(anchor, p, termAs, termFrom)
    }
}
