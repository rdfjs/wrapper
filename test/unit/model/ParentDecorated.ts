import { getter, GetterArity, LiteralAs, LiteralFrom, setter, SetterArity, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"
import { ChildDecorated } from "./ChildDecorated.js"

export class ParentDecorated extends TermWrapper {
    @getter(Example.hasString, GetterArity.Singular, LiteralAs.string)
    public get hasString(): string {
        throw new Error
    }

    @setter(Example.hasString, SetterArity.Singular, LiteralFrom.string)
    public set hasString(_: string) {
    }

    @getter(Example.hasChild, GetterArity.Singular, TermAs.instance(ChildDecorated))
    public get hasChild(): ChildDecorated {
        throw new Error
    }

    @setter(Example.hasChild, SetterArity.Singular, TermFrom.instance)
    public set hasChild(_: ChildDecorated) {
        throw new Error
    }

    @getter(Example.hasChildSet, GetterArity.Set, TermAs.instance(ChildDecorated))
    public get hasChildSet(): Set<ChildDecorated> {
        throw new Error
    }
}
