import { TermWrapper } from "../TermWrapper.js"
import { CardinalityError } from "../errors/CardinalityError.js"
import { MappingArgumentError } from "../errors/MappingArgumentError.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"

export namespace RequiredFrom {
    /**
     * {@link ITermAsValueMapping | Maps} the single object of statements with the anchor term as subject and the given predicate.
     *
     * @param anchor1 - The wrapped term that is the subject of the matched statements.
     * @param p - The IRI of the predicate of the matched statements.
     * @param termAs - The mapper that converts the object term to a JavaScript value.
     * @returns The JavaScript value the single object term maps to.
     *
     * @throws {@link MappingArgumentError} If `termAs` is `undefined`.
     * @throws {@link CardinalityError} If there is no value or more than one value for the predicate on the anchor term.
     */
    export function subjectPredicate<T>(anchor1: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T {
        if (termAs === undefined) {
            throw new MappingArgumentError("termAs")
        }

        const anchor2 = anchor1.factory.namedNode(p)
        const matches = anchor1.dataset.match(anchor1 as Term, anchor2)[Symbol.iterator]()

        const {value: first, done: none} = matches.next()

        if (none) {
            throw new CardinalityError(anchor1 as Term, p, "none")
        }

        if (!matches.next().done) {
            throw new CardinalityError(anchor1 as Term, p, "multiple")
        }

        return termAs(new TermWrapper(first.object, anchor1.dataset, anchor1.factory))
    }
}
