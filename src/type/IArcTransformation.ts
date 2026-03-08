import type { IValueMapping } from "./IValueMapping.js"
import type { ITermMapping } from "./ITermMapping.js"
import type { TermWrapper } from "../TermWrapper.js"

export interface IArcTransformation<T> {
    (anchor: TermWrapper, predicate: string, value?: T, valueMapping?: IValueMapping<T>, termMapping?: ITermMapping<T>): any
}
