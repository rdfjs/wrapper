import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { DatasetWrapper } from "./DatasetWrapper.js"


export class NamedGraphDataset extends DatasetWrapper {
    constructor(protected readonly graph: Quad_Graph, dataset: DatasetCore, factory: DataFactory) {
        super(dataset, factory)
    }

}
