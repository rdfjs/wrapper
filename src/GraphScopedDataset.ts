import type { DataFactory, DatasetCore, DatasetFactory, Quad_Graph } from "@rdfjs/types"
import { DatasetWrapper } from "./DatasetWrapper.js"
import { ProjectedDataset } from "./ProjectedDataset.js"

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
        dataset: DatasetCore,
        factory: DataFactory,
        datasetFactory: DatasetFactory,
    ) {
        super(new ProjectedDataset(writeGraph, readGraphs, dataset, factory, datasetFactory), factory)
    }
}
