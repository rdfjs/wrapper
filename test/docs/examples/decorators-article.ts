import {
    TermWrapper,
    ValueMapping,
    TermMapping,
    ObjectMapping,
    getter,
    setter,
    GetterArity,
    SetterArity,
} from "@rdfjs/wrapper"

const SCHEMA = "https://schema.org/"

export class Tag extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined {
        throw new Error()
    }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}
}

export class Article extends TermWrapper {
    @getter(SCHEMA + "headline", GetterArity.Singular, ValueMapping.literalToString)
    get headline(): string {
        throw new Error()
    }

    @setter(SCHEMA + "headline", SetterArity.Singular, TermMapping.stringToLiteral)
    set headline(_: string) {}

    @getter(SCHEMA + "keywords", GetterArity.Set, ObjectMapping.as(Tag), ObjectMapping.as(Tag))
    get tags(): Set<Tag> {
        throw new Error()
    }
}
