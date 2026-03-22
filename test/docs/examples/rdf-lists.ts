import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"

export const EX = "https://example.org/"

export class Playlist extends TermWrapper {
    get tracks(): string[] | undefined {
        return this.singularNullable(
            EX + "tracks",
            ObjectMapping.asList(
                this,
                EX + "tracks",
                ValueMapping.literalToString,
                TermMapping.stringToLiteral,
            ),
        )
    }
}
