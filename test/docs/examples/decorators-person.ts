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

export class Friend extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined { throw new Error() }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}
}

export class PersonDecorated extends TermWrapper {
    @getter(SCHEMA + "name", GetterArity.SingularNullable, ValueMapping.literalToString)
    get name(): string | undefined { throw new Error() }

    @setter(SCHEMA + "name", SetterArity.SingularNullable, TermMapping.stringToLiteral)
    set name(_: string | undefined) {}

    @getter(SCHEMA + "age", GetterArity.SingularNullable, ValueMapping.literalToNumber)
    get age(): number | undefined { throw new Error() }

    @setter(SCHEMA + "age", SetterArity.SingularNullable, TermMapping.numberToLiteral)
    set age(_: number | undefined) {}

    @getter(SCHEMA + "knows", GetterArity.Set, ObjectMapping.as(Friend), ObjectMapping.as(Friend))
    get friends(): Set<Friend> { throw new Error() }
}
