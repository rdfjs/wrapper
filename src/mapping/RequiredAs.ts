import { TermWrapper } from "../TermWrapper.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { OptionalAs } from "./OptionalAs.js"

export namespace RequiredAs {
    export function object<T>(anchor: TermWrapper, p: string, value: T, termFrom: ITermFromValueMapping<T>) {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        OptionalAs.object(anchor, p, value, termFrom)
    }
}
