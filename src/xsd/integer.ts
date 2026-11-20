import { XSD } from "../vocabulary/XSD.js"
import { collapse, digits, lexicalError, lexicalPattern, sign } from "./pattern.js"

/**
 * The IRIs of the XSD datatypes whose value space is a subset of the integers.
 *
 * @see [integer in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#integer)
 */
export const integerDatatypes: string[] = [
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

const integerPattern = lexicalPattern`${sign}${digits}`

/**
 * Parses the lexical form of an XSD integer datatype.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @param datatype - The IRI of the datatype named in the error for an invalid lexical form.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseInteger(lexical: string, datatype: string = XSD.integer): bigint {
    const collapsed = collapse(lexical)

    if (!integerPattern.test(collapsed)) {
        throw lexicalError(datatype, lexical)
    }

    return BigInt(collapsed)
}

/**
 * Formats an integer as the canonical lexical form of `xsd:integer`.
 *
 * @param value - The value to format.
 * @returns The lexical form.
 * @throws {@link Error} If the value is a number that is not an integer.
 */
export function formatInteger(value: number | bigint): string {
    if (typeof value === "bigint") {
        return value.toString()
    }

    if (!Number.isInteger(value)) {
        throw new Error(`Value ${value} is not an integer`)
    }

    return BigInt(value).toString()
}
