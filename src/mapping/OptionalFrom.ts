import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"
import type { LanguagePreferences } from "../LanguagePreferences.js"

export namespace OptionalFrom {
    export function subjectPredicate<T>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            return termAs(new TermWrapper(q.object, anchor.dataset, anchor.factory))
        }

        return undefined
    }

    /**
     * Reads an optional string value from a language-tagged literal, selected according to the given language preferences.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param preferences - The language preferences to use for selection.
     * @returns The string value of the best-matching literal, or `undefined` if no match is found.
     */
    export function subjectPredicateByLanguage(anchor: TermWrapper, p: string, preferences: LanguagePreferences): string | undefined {
        const predicate = anchor.factory.namedNode(p)
        const matches = anchor.dataset.match(anchor as Term, predicate)
        const best = preferences.selectBest(matches)

        return best?.value
    }
}
