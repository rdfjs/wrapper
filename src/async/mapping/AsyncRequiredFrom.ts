import type { Quad_Subject } from "@rdfjs/types"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Asynchronous counterpart of
 * {@link "../../mapping/RequiredFrom.js"!RequiredFrom}.
 *
 * Reads exactly one matching quad from the wrapped dataset and returns
 * the value produced by `termAs`. Throws if zero or more than one quad
 * matches the supplied subject + predicate.
 */
export namespace AsyncRequiredFrom {
    export async function subjectPredicate<T>(
        anchor: AsyncTermWrapper,
        p: string,
        termAs: IAsyncTermAsValueMapping<T>,
    ): Promise<T> {
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

        const iterator = matches[Symbol.asyncIterator]()
        const first = await iterator.next()
        if (first.done) {
            throw new Error(`No value found for predicate ${p} on term ${anchor.value}`)
        }
        const second = await iterator.next()
        if (!second.done) {
            throw new Error(`More than one value for predicate ${p} on term ${anchor.value}`)
        }

        return termAs(new AsyncTermWrapper(first.value.object, anchor.dataset, anchor.factory))
    }
}
