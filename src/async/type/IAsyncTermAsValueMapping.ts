import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Maps an {@link AsyncTermWrapper} to a JavaScript value. The mapping
 * may be synchronous (returning the value directly) or asynchronous
 * (returning a {@link Promise}); consumers `await` the result either
 * way.
 */
export type IAsyncTermAsValueMapping<T> = (term: AsyncTermWrapper) => T | Promise<T>
