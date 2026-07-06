import { TermWrapper } from "../TermWrapper.js"
import { MappingArgumentError } from "../errors/MappingArgumentError.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { WrappingSet } from "../WrappingSet.js"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that expose RDF/JS graph patterns as mutable JavaScript {@link Set | sets}.
 */
export namespace SetFrom {
    /**
     * {@link ITermAsValueMapping | Maps} the objects of statements with the anchor term as subject and the given predicate to a mutable set of JavaScript values.
     *
     * @param anchor - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts object terms to JavaScript values.
     * @param termFrom - The mapper that converts JavaScript values to object terms.
     * @returns A mutable set backed by the underlying dataset.
     *
     * @throws {@link MappingArgumentError} If `termAs` or `termFrom` is `undefined`.
     */
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        if (termFrom === undefined) {
            throw new MappingArgumentError("termFrom")
        }

        return new WrappingSet(anchor, p, termAs, termFrom)
    }
}
