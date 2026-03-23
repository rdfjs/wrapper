import { LiteralAs, LiteralFrom, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class Child extends TermWrapper {
    public get hasString(): string | undefined {
        return this.singularNullable(Example.hasString, LiteralAs.string)
    }

    public set hasString(value: string | undefined) {
        this.overwriteNullable(Example.hasString, value, LiteralFrom.string)
    }
}
