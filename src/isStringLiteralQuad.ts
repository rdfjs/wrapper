import type { Literal, Quad } from "@rdfjs/types"
import { RDF } from "./vocabulary/RDF.js"
import { XSD } from "./vocabulary/XSD.js"

/**
 * Tests whether a quad's object is a string-typed literal
 * (`rdf:langString` or `xsd:string`).
 */
export function isStringLiteralQuad(quad: Quad): quad is Quad & { object: Literal } {
    const { object } = quad
    return object.termType === "Literal"
        && (object.datatype.value === RDF.langString || object.datatype.value === XSD.string)
}
