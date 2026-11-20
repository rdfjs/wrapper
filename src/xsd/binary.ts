import { XSD } from "../vocabulary/XSD.js"

/**
 * The IRIs of the XSD binary datatypes.
 *
 * @see [hexBinary in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#hexBinary)
 * @see [base64Binary in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#base64Binary)
 */
export const binaryDatatypes: string[] = [
    XSD.base64Binary,
    XSD.hexBinary,
]

/**
 * Parses the lexical form of `xsd:hexBinary`.
 *
 * @param lexical - The lexical form to parse.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseHexBinary(lexical: string): Uint8Array {
    return Uint8Array.fromHex(lexical)
}

/**
 * Parses the lexical form of `xsd:base64Binary`.
 *
 * @param lexical - The lexical form to parse.
 * @returns The parsed value.
 * @throws {@link SyntaxError} If the lexical form is not valid.
 */
export function parseBase64Binary(lexical: string): Uint8Array {
    return Uint8Array.fromBase64(lexical)
}

/**
 * Formats bytes as the lexical form of `xsd:hexBinary`.
 *
 * @param value - The value to format.
 * @returns The lexical form.
 */
export function formatHexBinary(value: Uint8Array): string {
    return value.toHex()
}

/**
 * Formats bytes as the lexical form of `xsd:base64Binary`.
 *
 * @param value - The value to format.
 * @returns The lexical form.
 */
export function formatBase64Binary(value: Uint8Array): string {
    return value.toBase64()
}
