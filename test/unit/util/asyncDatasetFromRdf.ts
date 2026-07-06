import type { AsyncDatasetCore } from "@rdfjs/types"
import { AsyncDatasetCore as SyncBackedAsyncDatasetCore } from "@jeswr/async-dataset"
import { datasetFromRdf } from "./datasetFromRdf.js"

export function asyncDatasetFromRdf(rdf: string): AsyncDatasetCore {
    return new SyncBackedAsyncDatasetCore(datasetFromRdf(rdf))
}
