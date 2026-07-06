import type { Literal } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
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

        return BigInt(term.value)
    }

    export function boolean(term: TermWrapper): boolean {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, XSD.boolean)

        return term.value === "true" || term.value === "1"
    }

    export function date(term: TermWrapper): Date {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...dateDatatypes)

        return new Date(term.value)
    }

    /**
     * {@link ITermAsValueMapping Maps} a language-tagged literal to an {@link ILangString}.
     *
     * @param {TermWrapper} term - The term containing a language-tagged string.
     * @return An {@link ILangString} carrying the term's {@link Literal.language | language tag} (`lang`) and lexical value (`string`).
     *
     * @remarks
     * Only literals with the [`rdf:langString`](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal) datatype are supported,
     * which is the datatype of every literal written with a language tag (e.g. `"..."@en`).
     *
     * Use {@link langTuple} to map the same literals to plain `[language, value]` tuples instead.
     *
     * @throws {@link !ReferenceError ReferenceError} If the term is `undefined` or `null`.
     * @throws {@link !TypeError TypeError} If the term is not a {@link TermWrapper}.
     * @throws {@link TermTypeError} If the term is not a {@link Literal}.
     * @throws {@link LiteralDatatypeError} If the term's datatype is not `rdf:langString`.
     *
     * @example Read a language-tagged string
     * The RDF
     * ```turtle
     * <s> <p> "The librarian"@en .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): ILangString {
     *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.langString)
     *     }
     * }
     * ```
     *
     * which returns the value `{lang: "en", string: "The librarian"}`.
     *
     * @see
     * - {@link ILangString}
     * - {@link LiteralFrom.langString} for the inverse mapping
     * - [Language-tagged strings in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
     */
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

        if (term.value === "INF") {
            return Number.POSITIVE_INFINITY
        }

        if (term.value === "-INF") {
            return Number.NEGATIVE_INFINITY
        }

        if (term.value === "NaN") {
            return Number.NaN
        }

        return Number(term.value)
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
        ensureDatatype(term, ...byteArrayDatatypes)

        switch (term.datatype.value) {
            case XSD.hexBinary:
                // TODO: When Node 25 - return Uint8Array.fromHex(term.value)
                return Uint8Array.from(Buffer.from(term.value, "hex"))

            default:
            case XSD.base64Binary:
                // TODO: When Node 25 - return Uint8Array.fromBase64(term.value)
                return Uint8Array.from(Buffer.from(term.value, "base64"))
        }
    }

    export function url(term: TermWrapper): URL {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, XSD.anyURI)

        return new URL(term.value)
    }

    /**
     * {@link ITermAsValueMapping Maps} a language-tagged literal to a `[language, value]` tuple.
     *
     * @param {TermWrapper} term - The term containing a language-tagged string.
     * @return A tuple of the term's {@link Literal.language | language tag} and lexical value.
     *
     * @remarks
     * Only literals with the [`rdf:langString`](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal) datatype are supported,
     * which is the datatype of every literal written with a language tag (e.g. `"..."@en`).
     *
     * Paired with {@link LiteralFrom.langTuple}, this mapper is suited as the read half of
     * {@link Mapping.languageDictionary}, which wraps a predicate holding one value per language as a `Map`.
     *
     * Use {@link langString} to map the same literals to {@link ILangString} objects instead.
     *
     * @throws {@link !ReferenceError ReferenceError} If the term is `undefined` or `null`.
     * @throws {@link !TypeError TypeError} If the term is not a {@link TermWrapper}.
     * @throws {@link TermTypeError} If the term is not a {@link Literal}.
     * @throws {@link LiteralDatatypeError} If the term's datatype is not `rdf:langString`.
     *
     * @example Read a language-tagged string as a tuple
     * The RDF
     * ```turtle
     * <s> <p> "The librarian"@en .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): [string, string] {
     *         return RequiredFrom.subjectPredicate(this, "p", LiteralAs.langTuple)
     *     }
     * }
     * ```
     *
     * which returns the value `["en", "The librarian"]`.
     *
     * @example Wrap language-tagged strings as a dictionary
     * The RDF
     * ```turtle
     * <s> <p> "The librarian"@en, "Le bibliothécaire"@fr .
     * ```
     *
     * can be represented by the mapping
     * ```ts
     * class Class extends TermWrapper {
     *     public get property(): Map<string, string> {
     *         return Mapping.languageDictionary(this, "p", LiteralAs.langTuple, LiteralFrom.langTuple)
     *     }
     * }
     * ```
     *
     * which returns a map of `"en" => "The librarian", "fr" => "Le bibliothécaire"`.
     *
     * @see
     * - {@link LiteralFrom.langTuple} for the inverse mapping
     * - {@link Mapping.languageDictionary}
     * - [Language-tagged strings in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
     */
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

const byteArrayDatatypes: string[] = [
    XSD.base64Binary,
    XSD.hexBinary,
]

const integerDatatypes: string[] = [
    XSD.integer,
    XSD.nonPositiveInteger,
    XSD.long,
    XSD.nonNegativeInteger,
    XSD.negativeInteger,
    XSD.int,
    XSD.unsignedLong,
    XSD.positiveInteger,
    XSD.short,
    XSD.unsignedInt,
    XSD.byte,
    XSD.unsignedShort,
    XSD.unsignedByte
]

const numericDatatypes: string[] = integerDatatypes.concat([
    XSD.decimal,
    XSD.float,
    XSD.double,
])

const dateDatatypes: string[] = [
    XSD.date,
    XSD.dateTime,
]
