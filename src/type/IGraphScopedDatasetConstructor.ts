import type { DataFactory, Quad, Quad_Graph } from "@rdfjs/types"
import type { GraphScopedDataset } from "../dataset/GraphScopedDataset.js"
import type { Triple } from "./ITriple.js"
import type { NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "../dataset/NotifyingDatasetCore.js"

/**
 * Constructor signature for any subclass of {@link GraphScopedDataset}.
 *
 * Used by {@link DatasetWrapper.scoped} to instantiate user-defined views
 * scoped to a configurable read/write graph subset.
 */
export type IGraphScopedDatasetConstructor<T extends GraphScopedDataset> = new (
    writeGraph: Quad_Graph,
    readGraphs: ReadonlyArray<Quad_Graph> | undefined,
    dataset: NotifyingDatasetCore<Quad, Quad>,
    factory: DataFactory,
    datasetFactory: NotifyingDatasetCoreFactory<Quad, Quad, NotifyingDatasetCore<Triple, Triple>>,
) => T
