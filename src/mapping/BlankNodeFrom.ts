import type { BlankNode, DataFactory, Term } from "@rdfjs/types"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that create RDF/JS blank nodes from JavaScript primitives.
 *
 * @see
 * - {@link BlankNode}
 * - [Blaqnk Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-blank-nodes)
 */
export namespace BlankNodeFrom {
    export function string(value: string | undefined, factory: DataFactory): Term {
        return factory.blankNode(value)
    }
}
