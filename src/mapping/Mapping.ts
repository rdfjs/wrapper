import { TermWrapper } from "../TermWrapper.js"
import { WrappingMap } from "../WrappingMap.js"
import { MappingArgumentError } from "../errors/MappingArgumentError.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"

export namespace Mapping {
    /**
     * {@link ITermAsValueMapping | Maps} the objects of statements with the anchor term as subject and the given predicate to a mutable map of JavaScript keys and values.
     *
     * @param anchor - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts object terms to JavaScript key-value pairs.
     * @param termFrom - The mapper that converts JavaScript key-value pairs to object terms.
     * @returns A mutable map backed by the underlying dataset.
     *
     * @throws {@link MappingArgumentError} If `termAs` or `termFrom` is `undefined`.
     */
    export function languageDictionary<TKey, TValue>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<[TKey, TValue]>, termFrom: ITermFromValueMapping<[TKey, TValue]>): Map<TKey, TValue> {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        if (termFrom === undefined) {
            throw new MappingArgumentError("termFrom")
        }

        return new WrappingMap(anchor, p, termAs, termFrom)
    }
}
