import type { ITermAsValueMapping } from "./ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./ITermFromValueMapping.js"
import type { TermWrapper } from "../TermWrapper.js"

export interface IArcTransformation<T> {
    (anchor: TermWrapper, predicate: string, value?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any
}
