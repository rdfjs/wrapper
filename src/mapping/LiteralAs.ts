import type { Literal } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import { binaryDatatypes, parseBase64Binary, parseHexBinary } from "../xsd/binary.js"
import { parseBoolean } from "../xsd/boolean.js"
import { dateDatatypes, parseDate, parseDateTime } from "../xsd/dateTime.js"
import { integerDatatypes, parseInteger } from "../xsd/integer.js"
import { numericDatatypes, parseNumeric } from "../xsd/numeric.js"
import { RDF } from "../vocabulary/RDF.js"
import { TermWrapper } from "../TermWrapper.js"
import type { ILangString } from "../type/ILangString.js"
import { ensureDatatype, ensureIs, ensurePresent, ensureTermType } from "../ensure.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that convert RDF/JS literals to JavaScript primitives.
 *
 * @see
 * - {@link Literal}
 * - [Literals in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
 */
export namespace LiteralAs {
    export function bigint(term: TermWrapper): bigint {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...integerDatatypes)

        return parseInteger(term.value, term.datatype.value)
    }

    export function boolean(term: TermWrapper): boolean {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, XSD.boolean)

        return parseBoolean(term.value)
    }

    export function date(term: TermWrapper): Date {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...dateDatatypes)

        return (term.datatype.value === XSD.date ? parseDate : parseDateTime)(term.value)
    }

    export function langString(term: TermWrapper): ILangString {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, RDF.langString)

        // TODO: Direction
        return {lang: term.language, string: term.value}
    }

    export function number(term: TermWrapper): number {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...numericDatatypes)

        return parseNumeric(term.value, term.datatype.value)
    }

    export function string(term: TermWrapper): string {
        ensurePresent(term)
        ensureIs(term, TermWrapper)

        return term.value
    }

    export function symbol(term: TermWrapper): symbol {
        ensurePresent(term)
        ensureIs(term, TermWrapper)

        return Symbol.for(term.value)
    }

    /**
     * {@link ITermAsValueMapping Maps} a binary literal to a typed array.
     *
     * @param {TermWrapper} term - The term containing hexadecimal or Base64 encoded binary data.
     * @return An array of 8-bit unsigned integers decoded from the term's value according to its datatype.
     *
     * @remarks
     * This method is only available in Node.js.
     *
     * Supports the following datatypes:
     * - [`xsd:base64Binary`](https://www.w3.org/TR/xmlschema-2/#base64Binary)
     * - [`xsd:hexBinary`](https://www.w3.org/TR/xmlschema-2/#hexBinary)
     *
     * Uses the following methods to convert eligible values:
     * - [`Uint8Array.fromHex()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromHex)
     * - [`Uint8Array.fromBase64()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64)
     *
     * @throws {@link !ReferenceError ReferenceError} If the term is `undefined` or `null`.
     * @throws {@link !TypeError TypeError} If the term is not a {@link TermWrapper}.
     * @throws {@link TermTypeError} If the term is not a {@link Literal}.
     * @throws {@link LiteralDatatypeError} If the term's datatype is not one of the supported datatypes.
     * @throws {@link !SyntaxError SyntaxError} If the term's lexical value cannot be converted.
     *
     * @example Convert a hexadecimal value
     * The RDF
     * ```turtle
     * <s> <p> "30313233343536373839"^^<xsd:hexBinary> .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): Uint8Array {
     *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.uInt8Array)
     *     }
     * }
     * ```
     *
     * which returns the value `[48, 49, 50, 51, 52, 53, 54, 55, 56, 57]`.
     *
     * @example Convert a Bas64 value
     * The RDF
     * ```turtle
     * <s> <p> "MDEyMzQ1Njc4OQ=="^^<xsd:base64Binary> .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): Uint8Array {
     *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.uInt8Array)
     *     }
     * }
     * ```
     *
     * which returns the value `[48, 49, 50, 51, 52, 53, 54, 55, 56, 57]`.
     *
     * @see
     * - [Hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal)
     * - [Base64](https://en.wikipedia.org/wiki/Base64)
     */
    export function uInt8Array(term: TermWrapper): Uint8Array {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...binaryDatatypes)

        return (term.datatype.value === XSD.hexBinary ? parseHexBinary : parseBase64Binary)(term.value)
    }

    export function url(term: TermWrapper): URL {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, XSD.anyURI)

        return new URL(term.value)
    }

    export function langTuple(term: TermWrapper): [string, string] {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, RDF.langString)

        return [term.language, term.value]
    }

    export function datatypeTuple(term: TermWrapper): [string, string] {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")

        return [term.datatype.value, term.value]
    }
}
