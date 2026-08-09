import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"
import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import { AsyncWrappingSet } from "../AsyncWrappingSet.js"

/**
 * Asynchronous counterpart of
 * {@link "../../mapping/SetFrom.js"!SetFrom}. Returns an
 * {@link AsyncWrappingSet} bound to the supplied subject + predicate.
 */
export namespace AsyncSetFrom {
    export function subjectPredicate<T>(
        anchor: AsyncTermWrapper,
        p: string,
        termAs: IAsyncTermAsValueMapping<T>,
        termFrom: IAsyncTermFromValueMapping<T>,
    ): AsyncWrappingSet<T> {
        if (termAs === undefined) {
            throw new Error("termAs is required")
        }
        if (termFrom === undefined) {
            throw new Error("termFrom is required")
        }
        return new AsyncWrappingSet(anchor, p, termAs, termFrom)
    }
}
