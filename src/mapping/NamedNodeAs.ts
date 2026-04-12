import type { NamedNode } from "@rdfjs/types"
import { TermWrapper } from "../TermWrapper.js"
import type { TermNode } from "../TermWrapper.js"
import { ensureIs, ensurePresent, ensureTermType } from "../ensure.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that convert RDF/JS named nodes to JavaScript primitives.
 *
 * @see
 * - {@link NamedNode}
 * - [IRIs in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-IRIs)
 */
export namespace NamedNodeAs {
    export function string(term: TermNode): string {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "NamedNode")

        return term.value
    }
}
