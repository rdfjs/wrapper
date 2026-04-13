import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { WrappingSet } from "../WrappingSet.js"
import { LanguageSet } from "../LanguageSet.js"
import type { LanguagePreferences } from "../LanguagePreferences.js"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that expose RDF/JS graph patterns as mutable JavaScript {@link Set | sets}.
 */
export namespace SetFrom {
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingSet(anchor, p, termAs, termFrom)
    }

    /**
     * Creates a {@link Set} of strings backed by language-tagged literals, filtered by the given language preferences.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param preferences - The language preferences to use for filtering and writing.
     * @returns A live {@link LanguageSet} backed by the dataset.
     */
    export function subjectPredicateByLanguage(anchor: TermWrapper, p: string, preferences: LanguagePreferences): Set<string> {
        return new LanguageSet(anchor, p, preferences)
    }
}
