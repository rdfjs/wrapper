import { TermWrapper } from "../TermWrapper.js"
import { MappingArgumentError } from "../errors/MappingArgumentError.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"

export namespace OptionalFrom {
    /**
     * {@link ITermAsValueMapping | Maps} the object of the first statement with the anchor term as subject and the given predicate, if any.
     *
     * @param anchor - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts the object term to a JavaScript value.
     * @returns The JavaScript value the first object term maps to, or `undefined` if there is no value for the predicate on the anchor term.
     *
     * @throws {@link MappingArgumentError} If `termAs` is `undefined`.
     */
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            return termAs(new TermWrapper(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }
}
