/**
 * Parses the lexical form of `xsd:boolean`.
 *
 * @param lexical - The lexical form to parse.
 * @returns `true` if the lexical form is `true` or `1`, otherwise `false`.
 */
export function parseBoolean(lexical: string): boolean {
    return lexical === "true" || lexical === "1"
}

/**
 * Formats a boolean as the canonical lexical form of `xsd:boolean`.
 *
 * @param value - The value to format.
 * @returns The lexical form.
 */
export function formatBoolean(value: boolean): string {
    return value.toString()
}
