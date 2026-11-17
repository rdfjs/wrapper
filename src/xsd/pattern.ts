/**
 * Internal XML Schema lexical form helpers. This module is not part of the public API of the package.
 *
 * @packageDocumentation
 * @internal
 */

const xmlWhitespace = /[\t\n\r ]+/g

/**
 * Applies the XSD `collapse` whitespace facet to a lexical form: each run of XML whitespace (tab, line feed, carriage return and space) becomes one space, then leading and trailing spaces are removed.
 *
 * @param lexical - The lexical form to collapse.
 * @returns The collapsed lexical form.
 *
 * @see [whiteSpace in XML Schema 1.1 Part 2: Datatypes](https://www.w3.org/TR/xmlschema11-2/#rf-whiteSpace)
 */
export function collapse(lexical: string): string {
    return lexical.replaceAll(xmlWhitespace, " ").replace(/^ | $/g, "")
}

/**
 * A tagged template that builds an anchored {@link RegExp} from {@link RegExp} fragments.
 *
 * Each fragment is wrapped in a non-capturing group. The string parts are kept as written.
 *
 * @example
 * const digits = /\d+/
 * lexicalPattern`${digits}(?:\.${digits})?` // /^(?:\d+)(?:\.(?:\d+))?$/
 */
export function lexicalPattern(strings: TemplateStringsArray, ...fragments: RegExp[]): RegExp {
    const source = strings.raw.reduce((result, part, index) => {
        const fragment = fragments[index]

        return result + part + (fragment === undefined ? "" : `(?:${fragment.source})`)
    }, "")

    return new RegExp(`^${source}$`)
}

/**
 * Creates the error to throw for a lexical form that is not valid for an XSD datatype.
 *
 * @param datatype - The IRI of the datatype.
 * @param lexical - The invalid lexical form.
 * @returns A {@link SyntaxError} that names the datatype and the lexical form.
 */
export function lexicalError(datatype: string, lexical: string): SyntaxError {
    return new SyntaxError(`Value "${lexical}" is not a valid lexical form of ${datatype}`)
}
