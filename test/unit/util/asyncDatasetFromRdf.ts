import type { AsyncDatasetCore } from "@rdfjs/types"
import { AsyncDatasetCore as SyncBackedAsyncDatasetCore } from "@jeswr/async-dataset"
import { datasetFromRdf } from "./datasetFromRdf.js"

/**
 * The asynchronous counterpart of `datasetFromRdf`. Parses the given Turtle into an n3 store and exposes it through the asynchronous surface.
 *
 * The store is handed to the async dataset as a lazy, promise-returning source, so consuming tests genuinely exercise the asynchronous code paths.
 */
export function asyncDatasetFromRdf(rdf: string): AsyncDatasetCore {
    const dataset = datasetFromRdf(rdf)

    return new SyncBackedAsyncDatasetCore(() => Promise.resolve(dataset))
}
