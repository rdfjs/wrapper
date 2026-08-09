import { AsyncNotifyingDatasetCoreWrapper, type AsyncDefaultNotifyingDatasetCore } from "@rdfjs/wrapper"
import { Parser, Store } from "n3"

/**
 * Parses the Turtle in `rdf` into an n3 {@link Store} and returns it
 * exposed through the async surface as an {@link AsyncDefaultNotifyingDatasetCore}.
 * Counterpart of `datasetFromRdf`.
 */
export function asyncDatasetFromRdf(rdf: string, baseIRI?: string): AsyncDefaultNotifyingDatasetCore {
    const store = new Store()
    store.addQuads(new Parser({ baseIRI }).parse(rdf))
    return new AsyncNotifyingDatasetCoreWrapper(store) as unknown as AsyncDefaultNotifyingDatasetCore
}
