import type { Quad } from "@rdfjs/types"
import { Store } from "n3"
import {
    NotifyingDatasetCoreWrapper,
    type NotifyingDatasetCore,
    type NotifyingDatasetCoreFactory,
} from "@rdfjs/wrapper"

/**
 * Test-only {@link NotifyingDatasetCoreFactory} that produces datasets backed
 * by [n3](https://www.npmjs.com/package/n3) {@link Store}s wrapped in a
 * {@link NotifyingDatasetCoreWrapper}.
 */
export class N3StoreFactory implements NotifyingDatasetCoreFactory<Quad, Quad> {
    public dataset(quads?: Iterable<Quad>): NotifyingDatasetCore<Quad, Quad> {
        const store = new Store()
        if (quads) {
            for (const q of quads) {
                store.addQuad(q)
            }
        }
        return new NotifyingDatasetCoreWrapper(store)
    }
}

export const n3StoreFactory: any = new N3StoreFactory()
