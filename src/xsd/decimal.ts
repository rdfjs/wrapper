import { XSD } from "../vocabulary/XSD.js"
import { collapse, lexicalError, lexicalPattern, sign } from "./pattern.js"

/**
 * The IRIs of the XSD datatypes whose lexical form is a decimal number.
 *
 * @see [decimal in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#decimal)
 */
export const decimalDatatypes: string[] = [
    XSD.decimal
]

/**
 * A {@link RegExp} fragment that matches an unsigned decimal number.
 */
export const unsignedDecimal = /\d+(?:\.\d*)?|\.\d+/

const decimalPattern = lexicalPattern`${sign}${unsignedDecimal}`

/**
 * Parses the lexical form of `xsd:decimal`.
 *
 * @param lexical - The lexical form to parse. Whitespace is collapsed before parsing.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseDecimal(lexical: string): number {
    const collapsed = collapse(lexical)

    if (!decimalPattern.test(collapsed)) {
        throw lexicalError(XSD.decimal, lexical)
    }

    return Number(collapsed)
}
