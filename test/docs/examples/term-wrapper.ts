import { TermWrapper, ValueMapping, TermMapping } from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class Book extends TermWrapper {
    get title(): string {
        return this.singular(SCHEMA + "name", ValueMapping.literalToString)
    }

    set title(value: string) {
        this.overwrite(SCHEMA + "name", value, TermMapping.stringToLiteral)
    }

    get isbn(): string | undefined {
        return this.singularNullable(SCHEMA + "isbn", ValueMapping.literalToString)
    }

    set isbn(value: string | undefined) {
        this.overwriteNullable(SCHEMA + "isbn", value, TermMapping.stringToLiteral)
    }
}
