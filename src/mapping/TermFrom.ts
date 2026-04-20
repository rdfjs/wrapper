import type { DataFactory, Term } from "@rdfjs/types"
import { TermWrapper } from "../TermWrapper.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that create RDF/JS terms from JavaScript primitives.
 *
 * @see
 * - {@link Term}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export namespace TermFrom {
    export function instance(value: TermWrapper, factory: DataFactory): Term {
        return itself(value as Term, factory)
    }

    export function itself(value: Term, _: DataFactory): Term {
        return value
    }
}
