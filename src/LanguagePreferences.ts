import type { Literal, Quad } from "@rdfjs/types"
import { isStringLiteralQuad } from "./isStringLiteralQuad.js"

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
 * - `"@none"` — matches string literals that have no language tag (plain `xsd:string` or `rdf:langString` without a tag)
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
                t !== "@other" && this.matchesPreference(literalLanguage, t)
            )
        }
        return literalLanguage.toLowerCase() === preferenceTag.toLowerCase()
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
        return this.filterBest(quads).next().value
    }

    /**
     * From an iterable of quads, yields all literals whose language tag matches
     * the highest-priority preference that has at least one match.
     *
     * Considers language-tagged literals (`rdf:langString`) and plain string
     * literals (`xsd:string`). The `@none` preference matches plain strings.
     *
     * @param quads - The quads to search through.
     * @returns An iterable of matching literals (may be empty).
     */
    * filterBest(quads: Iterable<Quad>): IterableIterator<Literal> {
        const stringLiterals = [...this.collectStringLiterals(quads)]

        for (const tag of this.tags) {
            const matches = stringLiterals.filter(l => this.matchesPreference(l.language, tag))
            if (matches.length > 0) {
                yield* matches
                return
            }
        }
    }

    private * collectStringLiterals(quads: Iterable<Quad>): Iterable<Literal> {
        for (const quad of quads) {
            if (isStringLiteralQuad(quad)) {
                yield quad.object
            }
        }
    }
}
