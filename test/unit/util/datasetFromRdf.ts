import { NotifyingDatasetCoreWrapper, type DefaultDatasetCore } from "@rdfjs/wrapper";
import { Parser, Store } from "n3"

export function datasetFromRdf(rdf: string): DefaultDatasetCore {
    const store = new Store()
    store.addQuads(new Parser().parse(rdf));

    return new NotifyingDatasetCoreWrapper(store) as unknown as DefaultDatasetCore
}
