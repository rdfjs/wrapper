import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"

export namespace RequiredFrom {
    export function subjectPredicate<T>(anchor1: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const anchor2 = anchor1.factory.namedNode(p)
        const matches = anchor1.dataset.match(anchor1 as Term, anchor2, undefined, anchor1.factory.defaultGraph())[Symbol.iterator]()

        // TODO: Expose standard errors
        const {value: first, done: none} = matches.next()

        if (none) {
            throw new Error(`No value found for predicate ${p} on term ${anchor1.value}`)
        }

        if (!matches.next().done) {
            throw new Error(`More than one value for predicate ${p} on term ${anchor1.value}`)
        }

        return termAs(new TermWrapper(first.object, anchor1.dataset, anchor1.factory))
    }
}
