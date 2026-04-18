import { OptionalFrom } from "./OptionalFrom.js"
import { TermWrapper } from "../TermWrapper.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { Term } from "@rdfjs/types"
import type { LanguagePreferences } from "../LanguagePreferences.js"

export namespace RequiredFrom {
    export function subjectPredicate<T>(anchor1: TermWrapper, p: string, termAs: ITermAsValueMapping<T>): T {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const anchor2 = anchor1.factory.namedNode(p)
        const matches = anchor1.dataset.match(anchor1 as Term, anchor2)[Symbol.iterator]()

        // TODO: Expose standard errors
        const {value: first, done: none} = matches.next()

        if (none) {
            throw new Error(`No value found for predicate ${p} on term ${anchor1.value}`)
        }

        if (!matches.next().done) {
            throw new Error(`More than one value for predicate ${p} on term ${anchor1.value}`)
        }

        return termAs(new TermWrapper(first.object, anchor1.dataset, anchor1.factory))
    }

    /**
     * Reads a required string value from a language-tagged literal, selected according to the given language preferences.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param preferences - The language preferences to use for selection.
     * @returns The string value of the best-matching literal.
     * @throws If no `rdf:langString` literal matches any of the preferences.
     */
    export function subjectPredicateByLanguage(anchor: TermWrapper, p: string, preferences: LanguagePreferences): string {
        const best = OptionalFrom.subjectPredicateByLanguage(anchor, p, preferences)

        if (best === undefined) {
            throw new Error(`No value found for predicate ${p} on term ${anchor.value} matching language preferences`)
        }

        return best
    }
}
