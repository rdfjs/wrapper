import type { DataFactory, DatasetCore, DatasetCoreFactory, Quad_Graph } from "@rdfjs/types"
import type { GraphScopedDataset } from "../GraphScopedDataset.js"

export type IGraphScopedDatasetConstructor<T extends GraphScopedDataset> = new (
    writeGraph: Quad_Graph,
    readGraphs: ReadonlyArray<Quad_Graph> | undefined,
    dataset: DatasetCore,
    factory: DataFactory,
    datasetFactory: DatasetCoreFactory,
) => T
