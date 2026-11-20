import { XSD } from "../vocabulary/XSD.js"
import { unsignedDecimal } from "./decimal.js"
import { collapse, lexicalError, lexicalPattern, sign } from "./pattern.js"

/**
 * The IRIs of the XSD datatypes whose lexical form is a floating point number.
 *
 * @see
 * - [float in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#float)
 * - [double in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#double)
 */
export const floatDatatypes: string[] = [
    XSD.float,
    XSD.double
]

const exponent = /[Ee][+-]?\d+/
const floatPattern = lexicalPattern`${sign}${unsignedDecimal}(?:${exponent})?`

/**
 * Parses the lexical form of an XSD floating point datatype.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @param datatype - The IRI of the datatype named in the error for an invalid lexical form.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseDouble(lexical: string, datatype: string = XSD.double): number {
    const collapsed = collapse(lexical)

    if (collapsed === "INF" || collapsed === "+INF") {
        return Number.POSITIVE_INFINITY
    }

    if (collapsed === "-INF") {
        return Number.NEGATIVE_INFINITY
    }

    if (collapsed === "NaN") {
        return Number.NaN
    }

    if (!floatPattern.test(collapsed)) {
        throw lexicalError(datatype, lexical)
    }

    return Number(collapsed)
}

/**
 * Formats a number as the lexical form of `xsd:double`.
 *
 * @param value - The value to format.
 * @returns The lexical form.
 */
export function formatDouble(value: number): string {
    if (value === Number.POSITIVE_INFINITY) {
        return "INF"
    }

    if (value === Number.NEGATIVE_INFINITY) {
        return "-INF"
    }

    if (Object.is(value, -0)) {
        return "-0"
    }

    return value.toString()
}
