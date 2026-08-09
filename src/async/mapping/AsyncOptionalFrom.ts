import type { Quad_Subject } from "@rdfjs/types"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Asynchronous counterpart of
 * {@link "../../mapping/OptionalFrom.js"!OptionalFrom}. Returns the
 * mapped value of the first matching quad, or `undefined` if none
 * exists.
 */
export namespace AsyncOptionalFrom {
    export async function subjectPredicate<T>(
        anchor: AsyncTermWrapper,
        p: string,
        termAs: IAsyncTermAsValueMapping<T>,
    ): Promise<T | undefined> {
        if (termAs === undefined) {
            throw new Error("termAs is required")
        }

        const predicate = anchor.factory.namedNode(p)
        const matches = anchor.dataset.match(
            anchor as unknown as Quad_Subject,
            predicate,
            undefined,
            anchor.factory.defaultGraph(),
        )

        for await (const q of matches) {
            return termAs(new AsyncTermWrapper(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }
}
