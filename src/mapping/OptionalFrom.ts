import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Quad_Subject, Term } from "@rdfjs/types"

export namespace OptionalFrom {
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Quad_Subject, predicate, undefined, anchor.factory.defaultGraph())) {
            return termAs(new TermWrapper(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }
}
