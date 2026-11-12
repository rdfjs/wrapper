import type { NamedNode } from "@rdfjs/types"
import { TermWrapper } from "../TermWrapper.js"
import { ensureIs, ensurePresent, ensureTermType } from "../ensure.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that convert RDF/JS named nodes to JavaScript primitives.
 *
 * @see
 * - {@link NamedNode}
 * - [IRIs in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-IRIs)
 */
export namespace NamedNodeAs {
    export function string(term: TermWrapper): string {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "NamedNode")

        return term.value
    }

    /**
     * {@link ITermAsValueMapping Maps} a named node to a URL.
     *
     * @param term The term
     * @return A URL that represents the IRI of the named node.
     *
     * @remarks
     * Lexical values of named nodes can be illegal URLs because the rules for handling [IRI](https://www.w3.org/TR/rdf11-concepts/#section-IRIs)s in RDF frameworks that implement RDF/JS can differ from the rules for handling [URL](https://url.spec.whatwg.org/)s in JavaScript engines.
     *
     * @example Convert a named node to a URL
     * The RDF
     * ```turtle
     * BASE <http://example.com/>
     *
     * <s> <p> <o> .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): URL {
     *         return RequiredFrom.subjectPredicate(this, "http://example.com/p", NamedNodeAs.url)
     *     }
     * }
     * ```
     *
     * which returns the value `http://example.com/o`.
     *
     * @throws {@link !ReferenceError ReferenceError} If the term is `undefined` or `null`.
     * @throws {@link !TypeError TypeError} If the term is not a {@link TermWrapper}.
     * @throws {@link TermTypeError} If the term is not a {@link NamedNode}
     * @throws {@link !TypeError TypeError} If the value of the term cannot be parsed to a valid {@link URL}.
     */
    export function url(term: TermWrapper): URL {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "NamedNode")

        return new URL(term.value)
    }
}
