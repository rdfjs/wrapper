import type { DataFactory, Quad, Quad_Graph } from "@rdfjs/types"
import { DatasetWrapper } from "../DatasetWrapper.js"
import { ProjectedDatasetCoreWrapper } from "./ProjectedDataset.js"
import { Triple } from "../type/ITriple.js"
import { NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./NotifyingDatasetCore.js"

/**
 * A {@link DatasetWrapper} that exposes a configurable set of graphs from
 * an underlying dataset projected onto the default graph.
 *
 * It is the recommended way to use existing {@link DatasetWrapper} or
 * {@link TermWrapper} subclasses against quads that live in named graphs:
 * because the projection rewrites every read quad to the default graph,
 * mappers that only operate on the default graph (which is most of them)
 * just work.
 *
 * - **Reads** come from the configured `readGraphs`. Triples appearing in
 *   more than one read graph are deduplicated. When `readGraphs` is
 *   `undefined`, every graph (default and named) is read - effectively a
 *   union view.
 * - **Writes** ({@link DatasetWrapper.add}, {@link DatasetWrapper.delete},
 *   and any wrapper-driven mutation) are rewritten into the configured
 *   `writeGraph` in the underlying dataset.
 * - {@link DatasetWrapper.match} ignores the graph dimension; supplying a
 *   non-default graph throws a {@link TermTypeError}.
 * - **Notifications** attached via {@link DatasetWrapper.on} are fired
 *   only when the *projected* view actually changes: a triple appearing
 *   in several read graphs is reported as added once and as deleted only
 *   when the last copy disappears. Events are delivered with quads in
 *   the default graph, regardless of which read graph triggered them.
 *
 * Subclasses extend {@link GraphScopedDataset} the same way they extend
 * {@link DatasetWrapper}; consumers obtain instances via
 * {@link DatasetWrapper.scoped}.
 *
 * @example Wrapping a single named graph
 * ```ts
 * class People extends GraphScopedDataset {
 *     get all(): Iterable<Person> {
 *         return this.subjectsOf(":name", Person)
 *     }
 * }
 *
 * class Workspace extends DatasetWrapper {
 *     people(graph: string): People {
 *         return this.scoped(graph, [graph], People)
 *     }
 * }
 *
 * const ws = new Workspace(dataset, factory, datasetFactory)
 * for (const p of ws.people("https://example.org/team-a").all) {
 *     console.log(p.name)
 * }
 * ```
 *
 * @example Observing changes scoped to a graph
 * ```ts
 * const teamA = ws.people("https://example.org/team-a")
 * teamA.on((event, quad) => console.log(event, quad.object.value))
 * teamA.add(factory.quad(s, p, o)) // rewritten into team-a; listener fires once
 * ```
 *
 * @see {@link ProjectedDatasetCoreWrapper} - the underlying core view.
 * @see {@link DatasetWrapper.scoped} - the recommended factory.
 */
export class GraphScopedDataset extends DatasetWrapper {
    /**
     * Constructs a {@link GraphScopedDataset}.
     *
     * Application code typically does not call this constructor directly;
     * use {@link DatasetWrapper.scoped} on a parent {@link DatasetWrapper},
     * which resolves the graph IRIs and forwards the existing
     * `factory` / `datasetFactory`.
     *
     * @param writeGraph     The graph in the underlying dataset that
     *                       writes through this view are directed to.
     * @param readGraphs     The graphs read through this view. If
     *                       `undefined`, every graph in the underlying
     *                       dataset is read (a deduplicated union).
     * @param dataset        The underlying notifying dataset to project.
     * @param factory        Data factory used to build the rewritten
     *                       quads for both reads and writes.
     * @param datasetFactory Factory used to materialize the projected
     *                       view when a {@link match} result is consumed.
     */
    public constructor(
        writeGraph: Quad_Graph,
        readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        dataset: NotifyingDatasetCore<Quad, Quad>,
        factory: DataFactory<Triple, Triple>,
        datasetFactory: NotifyingDatasetCoreFactory<Quad, Quad, NotifyingDatasetCore<Triple, Triple>>,
    ) {
        super(new ProjectedDatasetCoreWrapper(writeGraph, readGraphs, dataset, factory, datasetFactory), factory, datasetFactory)
    }
}
