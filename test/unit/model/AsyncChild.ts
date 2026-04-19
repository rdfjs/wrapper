import {
    AsyncOptionalAs,
    AsyncOptionalFrom,
    AsyncLiteralAs,
    AsyncTermWrapper,
    LiteralFrom,
} from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"

/**
 * Async counterpart of `Child`. Properties return promises and
 * mutations are awaited.
 */
export class AsyncChild extends AsyncTermWrapper {
    public get hasString(): Promise<string | undefined> {
        return AsyncOptionalFrom.subjectPredicate(this, Example.hasString, AsyncLiteralAs.string)
    }

    public setHasString(value: string | undefined): Promise<void> {
        return AsyncOptionalAs.object(this, Example.hasString, value, LiteralFrom.string)
    }
}
