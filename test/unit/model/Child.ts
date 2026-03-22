import { TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class Child extends TermWrapper {
    public get hasString(): string | undefined {
        return this.singularNullable(Example.hasString, TermAs.string)
    }

    public set hasString(value: string | undefined) {
        this.overwriteNullable(Example.hasString, value, TermFrom.string)
    }
}
