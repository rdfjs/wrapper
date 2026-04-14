import type { DataFactory, DatasetCore, Quad_Graph } from "@rdfjs/types"
import type { NamedGraphDataset } from "../NamedGraphDataset.js"

export type INamedGraphDatasetConstructor<T extends NamedGraphDataset> = new (graph: Quad_Graph, dataset: DatasetCore, factory: DataFactory) => T
