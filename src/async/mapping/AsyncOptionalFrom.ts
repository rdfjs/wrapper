import type { Term } from "@rdfjs/types"
import { MappingArgumentError } from "../../errors/MappingArgumentError.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"

/**
 * The asynchronous counterpart of {@link OptionalFrom}.
 *
 * @see
 * - {@link OptionalFrom}
 * - {@link IAsyncTermAsValueMapping}
 */
export namespace AsyncOptionalFrom {
    /**
     * {@link IAsyncTermAsValueMapping | Maps} the object of the first statement with the anchor term as subject and the given predicate, if any.
     *
     * @param anchor - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts the object term to a JavaScript value.
     * @returns A promise of the JavaScript value the first object term maps to, or of `undefined` if there is no value for the predicate on the anchor term.
     *
     * @throws {@link MappingArgumentError} If `termAs` is `undefined`.
     *
     * @example Reading an optional property asynchronously
     * The RDF
     * ```turtle
     * <s> <p> "o" .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends AsyncTermWrapper {
     *     public get property(): Promise<string | undefined> {
     *         return AsyncOptionalFrom.subjectPredicate(this, "p", AsyncLiteralAs.string)
     *     }
     * }
     * ```
     *
     * so that `await new Class("s", asyncDataset, factory).property` resolves to `"o"`, and to `undefined` when the statement is absent.
     */
    export async function subjectPredicate<T>(anchor: AsyncTermWrapper, p: string, termAs: IAsyncTermAsValueMapping<T>): Promise<T | undefined> {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        const predicate = anchor.factory.namedNode(p)

        for await (const q of anchor.dataset.match(anchor as Term, predicate)) {
            return termAs(new AsyncTermWrapper(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }
}
