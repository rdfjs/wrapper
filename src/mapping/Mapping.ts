import { TermWrapper } from "../TermWrapper.js"
import { WrappingMap } from "../WrappingMap.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"

export namespace Mapping {
    export function languageDictionary<TKey, TValue>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<[TKey, TValue]>, termFrom: ITermFromValueMapping<[TKey, TValue]>): Map<TKey, TValue> {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingMap(anchor, p, termAs, termFrom)
    }
}
