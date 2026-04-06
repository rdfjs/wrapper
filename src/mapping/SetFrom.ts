import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { WrappingSet } from "../WrappingSet.js"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that expose RDF/JS graph patterns as mutable JavaScript {@link Set | sets}.
 */
export namespace SetFrom {
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingSet(anchor, p, termAs, termFrom)
    }
}
