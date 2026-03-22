import { TermWrapper, ValueMapping, TermMapping, ObjectMapping } from "@rdfjs/wrapper"

export class Person extends TermWrapper {
    get name(): string | undefined {
        return this.singularNullable("https://schema.org/name", ValueMapping.literalToString)
    }

    set name(value: string | undefined) {
        this.overwriteNullable("https://schema.org/name", value, TermMapping.stringToLiteral)
    }

    get friends(): Set<Person> {
        return this.objects(
            "https://schema.org/knows",
            ObjectMapping.as(Person),
            ObjectMapping.as(Person),
        )
    }
}
