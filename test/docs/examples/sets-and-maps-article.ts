import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

export class Article extends TermWrapper {
    get tags(): Set<string> {
        return this.objects(
            "https://schema.org/keywords",
            ValueMapping.literalToString,
            TermMapping.stringToLiteral,
        )
    }
}
