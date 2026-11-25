import { AsyncLiteralAs, AsyncOptionalAs, AsyncOptionalFrom, AsyncTermWrapper, LiteralFrom } from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

export class AsyncChild extends AsyncTermWrapper {
    public get hasString(): Promise<string | undefined> {
        return AsyncOptionalFrom.subjectPredicate(this, Example.hasString, AsyncLiteralAs.string)
    }

    public setHasString(value: string | undefined): Promise<void> {
        return AsyncOptionalAs.object(this, Example.hasString, value, LiteralFrom.string)
    }
}
