import { AsyncDatasetCore } from "@jeswr/async-dataset"
import { Parser, Store } from "n3"

/**
 * The asynchronous counterpart of `datasetFromRdf`. Parses the given Turtle into an n3 store and exposes it through the asynchronous surface.
 *
 * The store is handed to the {@link AsyncDatasetCore} as a lazy, promise-returning source, so consuming tests genuinely exercise the asynchronous code paths.
 */
export function asyncDatasetFromRdf(rdf: string): AsyncDatasetCore {
    const store = new Store()
    store.addQuads(new Parser().parse(rdf))

    return new AsyncDatasetCore(() => Promise.resolve(store))
}
