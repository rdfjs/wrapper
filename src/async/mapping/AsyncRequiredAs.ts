import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"
import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import { AsyncOptionalAs } from "./AsyncOptionalAs.js"

/**
 * Asynchronous counterpart of
 * {@link "../../mapping/RequiredAs.js"!RequiredAs}. Throws if `value` is
 * `undefined`; otherwise delegates to {@link AsyncOptionalAs.object}.
 */
export namespace AsyncRequiredAs {
    export function object<T>(
        anchor: AsyncTermWrapper,
        p: string,
        value: T,
        termFrom: IAsyncTermFromValueMapping<T>,
    ): Promise<void> {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }
        return AsyncOptionalAs.object(anchor, p, value, termFrom)
    }
}
