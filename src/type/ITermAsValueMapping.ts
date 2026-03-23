import type { TermWrapper } from "../TermWrapper.js"

export interface ITermAsValueMapping<T> {
    (termWrapper: TermWrapper): T
}
