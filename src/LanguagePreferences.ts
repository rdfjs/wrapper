import type { Literal, Quad } from "@rdfjs/types"
import { RDF } from "./vocabulary/RDF.js"
import { XSD } from "./vocabulary/XSD.js"

/**
 * Represents an ordered list of language preferences for reading and writing
 * language-tagged RDF literals ({@link https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal | `rdf:langString`}).
 *
 * @remarks
 * Language preferences control how language-tagged string literals are selected
 * for reading and which language tag is used when writing.
 *
 * Valid preference values include:
 * - Any {@link https://en.wikipedia.org/wiki/IETF_language_tag | IETF language tag} (e.g., `"en"`, `"fr"`, `"ko"`)
 * - `"@none"` — matches literals with `rdf:langString` datatype but no language tag
 * - `"@other"` — matches any language not explicitly listed in the preferences
 *
 * For read operations, literals are searched in preference order and the first
 * match is returned. For write operations, the first preference that is not
 * `"@other"` is used as the language tag.
 *
 * @example Basic usage in a model class
 * ```ts
 * class Hospital extends TermWrapper {
 *   readonly languages = new LanguagePreferences("es", "ko", "@none")
 *
 *   get label(): string {
 *     return RequiredFrom.subjectPredicateByLanguage(this, "http://www.w3.org/2000/01/rdf-schema#label", this.languages)
 *   }
 *
 *   set label(value: string) {
 *     RequiredAs.objectByLanguage(this, "http://www.w3.org/2000/01/rdf-schema#label", value, this.languages)
 *   }
 * }
 * ```
 */
export class LanguagePreferences {
    /**
     * The ordered list of language preference tags.
     */
    public readonly tags: readonly string[]

    /**
     * Creates a new instance of {@link LanguagePreferences}.
     *
     * @param tags - An ordered list of language preferences. Earlier entries have higher priority.
     */
    constructor(...tags: string[]) {
        this.tags = tags
    }

    /**
     * The language tag to use for write operations.
     *
     * Returns the first preference that is not `"@other"`.
     * For `"@none"`, returns an empty string.
     * If all preferences are `"@other"` or the list is empty, returns an empty string.
     */
    get writeLanguage(): string {
        for (const tag of this.tags) {
            if (tag !== "@other") {
                return tag === "@none" ? "" : tag
            }
        }
        return ""
    }

    /**
     * Tests whether a literal's language tag matches a given preference tag.
     *
     * @param literalLanguage - The language tag of the literal (empty string if none).
     * @param preferenceTag - The preference tag to match against.
     */
    matchesPreference(literalLanguage: string, preferenceTag: string): boolean {
        if (preferenceTag === "@none") {
            return literalLanguage === ""
        }
        if (preferenceTag === "@other") {
            return !this.tags.some(t =>
                t !== "@other" && this.matchesLanguage(literalLanguage, t)
            )
        }
        return this.matchesLanguage(literalLanguage, preferenceTag)
    }

    /**
     * From an iterable of quads, selects the object literal of the first quad
     * whose language tag matches the highest-priority preference.
     *
     * Considers language-tagged literals (`rdf:langString`) and plain string
     * literals (`xsd:string`). The `@none` preference matches plain strings.
     *
     * @param quads - The quads to search through.
     * @returns The best-matching literal, or `undefined` if no match is found.
     */
    selectBest(quads: Iterable<Quad>): Literal | undefined {
        const stringQuads = this.collectStringQuads(quads)

        for (const tag of this.tags) {
            for (const quad of stringQuads) {
                const literal = quad.object as Literal
                if (this.matchesPreference(literal.language, tag)) {
                    return literal
                }
            }
        }

        return undefined
    }

    /**
     * From an iterable of quads, returns all literals whose language tag matches
     * the highest-priority preference that has at least one match.
     *
     * Considers language-tagged literals (`rdf:langString`) and plain string
     * literals (`xsd:string`). The `@none` preference matches plain strings.
     *
     * @param quads - The quads to search through.
     * @returns An array of matching literals (may be empty).
     */
    filterBest(quads: Iterable<Quad>): Literal[] {
        const stringQuads = this.collectStringQuads(quads)

        for (const tag of this.tags) {
            const results: Literal[] = []
            for (const quad of stringQuads) {
                const literal = quad.object as Literal
                if (this.matchesPreference(literal.language, tag)) {
                    results.push(literal)
                }
            }
            if (results.length > 0) {
                return results
            }
        }

        return []
    }

    private collectStringQuads(quads: Iterable<Quad>): Quad[] {
        const result: Quad[] = []
        for (const quad of quads) {
            const obj = quad.object
            if (obj.termType === "Literal") {
                const dt = (obj as Literal).datatype.value
                if (dt === RDF.langString || dt === XSD.string) {
                    result.push(quad)
                }
            }
        }
        return result
    }

    private matchesLanguage(literalLanguage: string, tag: string): boolean {
        if (tag === "@none") {
            return literalLanguage === ""
        }
        return literalLanguage.toLowerCase() === tag.toLowerCase()
    }
}
