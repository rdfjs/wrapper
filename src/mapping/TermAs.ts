import { TermWrapper } from "../TermWrapper.js"
import type { Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "../type/ITermWrapperConstructor.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { RdfList } from "../RdfList.js"
import { ensureIs, ensurePresent } from "../ensure.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that convert RDF terms to JavaScript constructs.
 */
export namespace TermAs {
    export function instance<T>(constructor: ITermWrapperConstructor<T>): ITermAsValueMapping<T> {
        return (term: TermWrapper) => {
            ensurePresent(term)
            ensureIs(term, TermWrapper)

            return new constructor(term as Term, term.dataset, term.factory)
        }
    }

    export function is<T extends TermWrapper>(term: T): T {
        return term
    }

    export function list<T>(subject: TermWrapper, predicate: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): ITermAsValueMapping<T[]> {
        return (term: TermWrapper) => {
            ensurePresent(term)
            ensureIs(term, TermWrapper)

            return new RdfList(term as Term, subject, predicate, termAs, termFrom)
        }
    }

    export function term(term: TermWrapper): Term {
        return term as Term
    }
}
