import { TermWrapper } from "../TermWrapper.js"
import type { TermNode } from "../TermWrapper.js"
import type { Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "../type/ITermWrapperConstructor.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { RdfList } from "../RdfList.js"
import { ensureIs, ensureListRoot, ensurePresent } from "../ensure.js"

/**
 * A collection of {@link ITermAsValueMapping mappers} that convert RDF/JS terms to JavaScript constructs.
 *
 * @see
 * - {@link Term}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export namespace TermAs {
    export function instance<T extends TermWrapper>(constructor: ITermWrapperConstructor<T>): ITermAsValueMapping<T & TermNode> {
        return (term: TermNode<Term>) => {
            ensurePresent(term)
            ensureIs(term, TermWrapper)

            return constructor.from(term, term.dataset, term.factory) as T & TermNode
        }
    }

    export function is<T extends TermNode>(term: T): T {
        return term
    }

    export function list<T>(subject: TermNode, predicate: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): ITermAsValueMapping<T[]> {
        return (term: TermNode) => {
            ensurePresent(term)
            ensureIs(term, TermWrapper)
            ensureListRoot(term)

            return new RdfList(term, subject, predicate, termAs, termFrom)
        }
    }

    export function term(term: TermNode): Term {
        return term
    }
}
