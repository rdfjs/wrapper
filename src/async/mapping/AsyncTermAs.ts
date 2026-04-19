import type { Term } from "@rdfjs/types"
import type { IAsyncTermAsValueMapping } from "../type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermWrapperConstructor } from "../type/IAsyncTermWrapperConstructor.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import { ensureIs, ensurePresent } from "../../ensure.js"

/**
 * Asynchronous counterpart of {@link "../../mapping/TermAs.js"!TermAs}.
 * Provides mappers from RDF terms to user types built around
 * {@link AsyncTermWrapper}.
 */
export namespace AsyncTermAs {
    /**
     * Mapper that constructs a wrapper of `constructor` from the term.
     * The new wrapper inherits the dataset and factory of the source.
     */
    export function instance<T>(constructor: IAsyncTermWrapperConstructor<T>): IAsyncTermAsValueMapping<T> {
        return (term: AsyncTermWrapper) => {
            ensurePresent(term)
            ensureIs(term, AsyncTermWrapper)
            return new constructor(term as unknown as Term, term.dataset, term.factory)
        }
    }

    /** Identity mapper - returns the supplied wrapper unchanged. */
    export function is<T extends AsyncTermWrapper>(term: T): T {
        return term
    }

    /** Maps to the underlying {@link Term}. */
    export function term(term: AsyncTermWrapper): Term {
        return term as unknown as Term
    }
}
