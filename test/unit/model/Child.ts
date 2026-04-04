import { LiteralAs, LiteralFrom, OptionalAs, OptionalFrom, TermWrapper } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class Child extends TermWrapper {
    public get hasString(): string | undefined {
        return OptionalFrom.subjectPredicate(this, Example.hasString, LiteralAs.string)
    }

    public set hasString(value: string | undefined) {
        OptionalAs.object(this, Example.hasString, value, LiteralFrom.string)
    }
}
