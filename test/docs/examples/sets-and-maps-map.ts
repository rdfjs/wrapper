import { TermWrapper } from "@rdfjs/wrapper"

export class Resource extends TermWrapper {
    /**
     * Expose language-tagged labels as a Map<lang, label>.
     * The RDF object is a language-tagged literal; we split it into [lang, string].
     */
    get labels(): Map<string, string> {
        return this.map(
            "https://www.w3.org/2000/01/rdf-schema#label",
            (termWrapper) => [termWrapper.language, termWrapper.value] as [string, string],
            ([lang, str], dataset, factory) => {
                return new TermWrapper(factory.literal(str, lang), dataset, factory)
            },
        )
    }
}
