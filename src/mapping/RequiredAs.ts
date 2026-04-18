import { TermWrapper } from "../TermWrapper.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { OptionalAs } from "./OptionalAs.js"
import type { LanguagePreferences } from "../LanguagePreferences.js"

export namespace RequiredAs {
    export function object<T>(anchor: TermWrapper, p: string, value: T, termFrom: ITermFromValueMapping<T>) {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        OptionalAs.object(anchor, p, value, termFrom)
    }

    /**
     * Writes a required string value using the write language from the given preferences, as either a
     * language-tagged literal or an untagged string literal when the resolved write language is empty.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param value - The string value to write.
     * @param preferences - The language preferences to use for the write language.
     * @throws If `value` is `undefined`.
     */
    export function objectByLanguage(anchor: TermWrapper, p: string, value: string, preferences: LanguagePreferences) {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        OptionalAs.objectByLanguage(anchor, p, value, preferences)
    }
}
