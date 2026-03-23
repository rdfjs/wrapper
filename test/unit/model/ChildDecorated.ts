import { getter, GetterArity, LiteralAs, LiteralFrom, setter, SetterArity, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class ChildDecorated extends TermWrapper {
    @getter(Example.hasString, GetterArity.SingularNullable, LiteralAs.string)
    public get hasString(): string | undefined {
        throw new Error
    }

    @setter(Example.hasString, SetterArity.SingularNullable, LiteralFrom.string)
    public set hasString(_: string | undefined) {
    }
}
