import type { Quad } from "@rdfjs/types"
import { Store } from "n3"
import {
    AsyncNotifyingDatasetCoreWrapper,
    type AsyncNotifyingDatasetCore,
    type AsyncNotifyingDatasetCoreFactory,
} from "@rdfjs/wrapper"

/**
 * Test-only {@link AsyncNotifyingDatasetCoreFactory} that produces
 * datasets backed by an n3 {@link Store} but exposed through the async
 * surface. The store itself is synchronous; the wrapper bridges it into
 * the async pipeline by resolving every operation on the microtask
 * queue, which is enough to exercise the async code paths.
 */
export class AsyncN3StoreFactory implements AsyncNotifyingDatasetCoreFactory<Quad, Quad> {
    public async dataset(quads?: AsyncIterable<Quad> | Iterable<Quad>): Promise<AsyncNotifyingDatasetCore<Quad, Quad>> {
        const store = new Store()
        if (quads !== undefined) {
            if (Symbol.asyncIterator in quads) {
                for await (const q of quads as AsyncIterable<Quad>) {
                    store.addQuad(q)
                }
            } else {
                for (const q of quads as Iterable<Quad>) {
                    store.addQuad(q)
                }
            }
        }
        return new AsyncNotifyingDatasetCoreWrapper<Quad, Quad>(store)
    }
}

export const asyncN3StoreFactory: any = new AsyncN3StoreFactory()
