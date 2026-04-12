import type { TermNode } from "../TermWrapper.js"
import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"

export namespace OptionalFrom {
    export function subjectPredicate<T>(anchor: TermNode, p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor, predicate)) {
            return termAs(TermWrapper.from(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }
}
