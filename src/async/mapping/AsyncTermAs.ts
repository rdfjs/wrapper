import type { Term } from "@rdfjs/types"
import { ensureIs, ensurePresent } from "../../ensure.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermWrapperConstructor } from "../type/IAsyncTermWrapperConstructor.js"

/**
 * The asynchronous counterpart of {@link TermAs}: a collection of {@link IAsyncTermAsValueMapping | mappers} that convert RDF/JS terms found in asynchronous datasets to JavaScript constructs.
 *
 * @see
 * - {@link TermAs}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export namespace AsyncTermAs {
    /**
     * Creates a mapper that constructs an instance of the given {@link AsyncTermWrapper} subclass from the term. The new wrapper inherits the asynchronous dataset and the factory of the source term.
     *
     * @param constructor - The constructor of the mapping class to instantiate.
     * @returns A mapper that converts terms to instances of the mapping class.
     */
    export function instance<T>(constructor: IAsyncTermWrapperConstructor<T>): IAsyncTermAsValueMapping<T> {
        return (term: AsyncTermWrapper) => {
            ensurePresent(term)
            ensureIs(term, AsyncTermWrapper)

            return new constructor(term as Term, term.dataset, term.factory)
        }
    }

    /**
     * The identity mapper. Returns the supplied wrapper unchanged.
     */
    export function is<T extends AsyncTermWrapper>(term: T): T {
        return term
    }

    /**
     * Maps to the underlying {@link Term}.
     */
    export function term(term: AsyncTermWrapper): Term {
        return term as Term
    }
}
