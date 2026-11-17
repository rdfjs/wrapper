import type { Literal } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import { collapse } from "../xsd/pattern.js"
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

        return BigInt(parseLexical(term.value, integerPattern, term.datatype.value))
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

        return parseDate(term.value, term.datatype.value)
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

        const datatype = term.datatype.value

        if (datatype === XSD.float || datatype === XSD.double) {
            const lexical = collapse(term.value)

            if (lexical === "INF" || lexical === "+INF") {
                return Number.POSITIVE_INFINITY
            }

            if (lexical === "-INF") {
                return Number.NEGATIVE_INFINITY
            }

            if (lexical === "NaN") {
                return Number.NaN
            }

            return Number(parseLexical(lexical, floatPattern, datatype))
        }

        if (datatype === XSD.decimal) {
            return Number(parseLexical(term.value, decimalPattern, datatype))
        }

        return Number(parseLexical(term.value, integerPattern, datatype))
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
                return Uint8Array.fromHex(term.value)

            default:
            case XSD.base64Binary:
                return Uint8Array.fromBase64(term.value)
        }
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

const integerPattern = /^[+-]?\d+$/
const decimalPattern = /^[+-]?(\d+(\.\d*)?|\.\d+)$/
const floatPattern = /^[+-]?((\d+(\.\d*)?|\.\d+)([Ee][+-]?\d+)?)$/
const datePattern = /^(-?(?:[1-9]\d{3,}|0\d{3}))-(\d{2})-(\d{2})(Z|[+-]\d{2}:\d{2})?$/
const dateTimePattern = /^(-?(?:[1-9]\d{3,}|0\d{3}))-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$/

function parseLexical(value: string, pattern: RegExp, datatype: string): string {
    const lexical = collapse(value)

    if (!pattern.test(lexical)) {
        throw new SyntaxError(`Value "${value}" is not a valid lexical form of ${datatype}`)
    }

    return lexical
}

function isValidTimezone(timezone: string | undefined): boolean {
    if (timezone === undefined || timezone === "Z") {
        return true
    }

    const hours = Number(timezone.slice(1, 3))
    const minutes = Number(timezone.slice(4, 6))

    return minutes <= 59 && (hours < 14 || (hours === 14 && minutes === 0))
}

function daysInMonth(year: number, month: number): number {
    if (month === 2) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
    }

    return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function isoYear(year: number): string {
    if (year >= 0 && year <= 9999) {
        return year.toString().padStart(4, "0")
    }

    return (year < 0 ? "-" : "+") + Math.abs(year).toString().padStart(6, "0")
}

function parseDate(value: string, datatype: string): Date {
    const lexical = collapse(value)
    const invalid = () => new SyntaxError(`Value "${value}" is not a valid lexical form of ${datatype}`)
    const isDate = datatype === XSD.date
    const match = (isDate ? datePattern : dateTimePattern).exec(lexical)

    if (match === null) {
        throw invalid()
    }

    const year = Number(match[1]) + 0
    const month = Number(match[2])
    const day = Number(match[3])
    const hours = isDate ? 0 : Number(match[4])
    const minutes = isDate ? 0 : Number(match[5])
    const seconds = isDate ? 0 : Number(match[6])
    const fraction = isDate ? "" : match[7] ?? ""
    const timezone = isDate ? match[4] : match[8]

    const validTime = isDate || (
        minutes <= 59 &&
        seconds <= 59 &&
        (hours <= 23 || (hours === 24 && minutes === 0 && seconds === 0 && /^0*$/.test(fraction)))
    )

    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month) || !validTime || !isValidTimezone(timezone)) {
        throw invalid()
    }

    const pad = (n: number) => n.toString().padStart(2, "0")
    const rollover = hours === 24
    const date = `${isoYear(year)}-${pad(month)}-${pad(day)}`
    const time = `${pad(rollover ? 0 : hours)}:${pad(minutes)}:${pad(seconds)}.${fraction.padEnd(3, "0").slice(0, 3)}`
    const iso = isDate && timezone === undefined ? date : `${date}T${time}${timezone ?? ""}`

    const result = new Date(iso)

    if (rollover) {
        result.setTime(result.getTime() + 86400000)
    }

    if (Number.isNaN(result.getTime())) {
        throw invalid()
    }

    return result
}
