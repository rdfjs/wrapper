import type { Term } from "@rdfjs/types"
import { CardinalityError } from "../../errors/CardinalityError.js"
import { MappingArgumentError } from "../../errors/MappingArgumentError.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"

/**
 * The asynchronous counterpart of {@link RequiredFrom}.
 *
 * @see
 * - {@link RequiredFrom}
 * - {@link IAsyncTermAsValueMapping}
 */
export namespace AsyncRequiredFrom {
    /**
     * {@link IAsyncTermAsValueMapping | Maps} the single object of statements with the anchor term as subject and the given predicate.
     *
     * @remarks
     * The matching quads are pulled from the asynchronous dataset one at a time: the first iterator step must produce a quad and the second must signal completion, otherwise the expected cardinality of exactly one is violated.
     *
     * @param anchor1 - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts the object term to a JavaScript value.
     * @returns A promise of the JavaScript value the single object term maps to.
     *
     * @throws {@link MappingArgumentError} If `termAs` is `undefined`.
     * @throws {@link CardinalityError} If there is no value or more than one value for the predicate on the anchor term.
     *
     * @example Reading a required property asynchronously
     * The RDF
     * ```turtle
     * <s> <p> "o" .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends AsyncTermWrapper {
     *     public get property(): Promise<string> {
     *         return AsyncRequiredFrom.subjectPredicate(this, "p", AsyncLiteralAs.string)
     *     }
     * }
     * ```
     *
     * so that `await new Class("s", asyncDataset, factory).property` resolves to `"o"`.
     */
    export async function subjectPredicate<T>(anchor1: AsyncTermWrapper, p: string, termAs: IAsyncTermAsValueMapping<T>): Promise<T> {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        const anchor2 = anchor1.factory.namedNode(p)
        const matches = anchor1.dataset.match(anchor1 as Term, anchor2)[Symbol.asyncIterator]()

        const {value: first, done: none} = await matches.next()

        if (none) {
            throw new CardinalityError(anchor1 as Term, p, "none")
        }

        if (!(await matches.next()).done) {
            throw new CardinalityError(anchor1 as Term, p, "multiple")
        }

        return termAs(new AsyncTermWrapper(first.object, anchor1.dataset, anchor1.factory))
    }
}
