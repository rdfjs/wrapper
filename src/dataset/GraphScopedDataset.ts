import type { DataFactory, Quad, Quad_Graph } from "@rdfjs/types"
import { DatasetWrapper } from "../DatasetWrapper.js"
import { ProjectedDatasetCoreWrapper } from "./ProjectedDataset.js"
import { Triple } from "../type/ITriple.js"
import { NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./NotifyingDatasetCore.js"

/**
 * A {@link DatasetWrapper} that exposes a configurable set of graphs from an
 * underlying dataset projected onto the default graph.
 *
 * The wrapper writes new quads to a single configured `writeGraph` and reads
 * from the supplied `readGraphs`. When `readGraphs` is `undefined`, every
 * graph (default and named) is read and triples are deduplicated across them.
 *
 * @see {@link ProjectedDataset}
 */
export class GraphScopedDataset extends DatasetWrapper {
    public constructor(
        writeGraph: Quad_Graph,
        readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        dataset: NotifyingDatasetCore<Quad, Quad>,
        factory: DataFactory,
        datasetFactory: NotifyingDatasetCoreFactory<Quad, Quad, NotifyingDatasetCore<Triple, Triple>>,
    ) {
        super(new ProjectedDatasetCoreWrapper(writeGraph, readGraphs, dataset, factory, datasetFactory), factory, datasetFactory)
    }
}
