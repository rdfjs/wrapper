import { getter, GetterArity, setter, SetterArity, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class ChildDecorated extends TermWrapper {
    @getter(Example.hasString, GetterArity.SingularNullable, TermAs.string)
    public get hasString(): string | undefined {
        throw new Error
    }

    @setter(Example.hasString, SetterArity.SingularNullable, TermFrom.string)
    public set hasString(_: string | undefined) {
    }
}
