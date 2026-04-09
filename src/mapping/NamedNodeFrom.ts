import type { DataFactory, NamedNode, Term } from "@rdfjs/types"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that create RDF/JS named nodes from JavaScript primitives.
 *
 * @see
 * - {@link NamedNode}
 * - [IRIs in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-IRIs)
 */
export namespace NamedNodeFrom {
    export function string(value: string, factory: DataFactory): Term {
        return factory.namedNode(value)
    }

    export function url(value: URL, factory: DataFactory): Term {
        return string(value.toString(), factory)
    }
}
