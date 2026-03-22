import {
    TermWrapper,
    ValueMapping,
    TermMapping,
    getter,
    GetterArity,
} from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class ArticleManual extends TermWrapper {
    // Manual equivalent
    get headline(): string {
        return this.singular(SCHEMA + "headline", ValueMapping.literalToString)
    }
}

export class ArticleDecorated extends TermWrapper {
    // Decorated
    @getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
    get headline(): string { throw new Error() }
}
