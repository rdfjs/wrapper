import { XSD } from "../vocabulary/XSD.js"
import { decimalDatatypes, parseDecimal } from "./decimal.js"
import { floatDatatypes, parseDouble } from "./float.js"
import { integerDatatypes, parseInteger } from "./integer.js"

/**
 * The IRIs of the XSD datatypes that {@link parseNumeric} supports.
 */
export const numericDatatypes: string[] = [
    ...integerDatatypes,
    ...decimalDatatypes,
    ...floatDatatypes
]

/**
 * Parses the lexical form of an XSD numeric datatype to a number.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @param datatype - The IRI of the datatype.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseNumeric(lexical: string, datatype: string): number {
    if (floatDatatypes.includes(datatype)) {
        return parseDouble(lexical, datatype)
    }

    if (datatype === XSD.decimal) {
        return parseDecimal(lexical)
    }

    return Number(parseInteger(lexical, datatype))
}
