import type { Term } from "@rdfjs/types"
import { TermWrapper } from "./TermWrapper.js"
import { isStringLiteralQuad } from "./isStringLiteralQuad.js"

/**
 * Returns a snapshot of all string-literal values for a given predicate,
 * grouped by language tag.
 *
 * @remarks
 * Considers literals with datatype `rdf:langString` (language-tagged strings)
 * as well as plain `xsd:string` literals. Literals without a language tag
 * (i.e. `xsd:string`) are grouped under the key `"@none"`.
 *
 * The returned map is a snapshot and is not backed by the dataset. Modifications
 * to the map will not affect the underlying RDF data.
 *
 * @param anchor - The subject term wrapper.
 * @param p - The predicate IRI.
 * @returns A map from language tag (or `"@none"`) to an array of string values.
 *
 * @example
 * Given the following RDF data:
 * ```turtle
 * <x> rdfs:label "Hospital" ;
 *     rdfs:label "Hôpital"@fr ;
 *     rdfs:label "병원"@ko .
 * ```
 *
 * ```ts
 * const langs = languagesOf(wrapper, "http://www.w3.org/2000/01/rdf-schema#label")
 * // Map { "@none" => ["Hospital"], "fr" => ["Hôpital"], "ko" => ["병원"] }
 * ```
 */
export function languagesOf(anchor: TermWrapper, p: string): Map<string, string[]> {
    const predicate = anchor.factory.namedNode(p)
    const result = new Map<string, string[]>()

    for (const q of anchor.dataset.match(anchor as Term, predicate)) {
        if (!isStringLiteralQuad(q)) continue

        const literal = q.object
        const lang = literal.language || "@none"
        const values = result.get(lang)
        if (values !== undefined) {
            values.push(literal.value)
        } else {
            result.set(lang, [literal.value])
        }
    }

    return result
}
