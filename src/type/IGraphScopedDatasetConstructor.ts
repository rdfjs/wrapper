import type { DataFactory, DatasetCore, Quad_Graph } from "@rdfjs/types"
import type { GraphScopedDataset } from "../GraphScopedDataset.js"

/**
 * Constructor signature for any subclass of {@link GraphScopedDataset}, as accepted by {@link DatasetWrapper.scoped}.
 */
export type IGraphScopedDatasetConstructor<T extends GraphScopedDataset> = new (writeGraph: Quad_Graph, readGraphs: ReadonlyArray<Quad_Graph> | undefined, dataset: DatasetCore, factory: DataFactory) => T
