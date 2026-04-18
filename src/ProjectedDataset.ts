import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { ensureDefaultGraph } from "./ensure.js"
import { ChangeEvent, EE, NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./NotifyingDatasetCore.js"
import { LazyMaterializedNotifyingDatasetCore } from "./LazyMaterializedNotifyingDatasetCore.js"

/**
 * A {@link NotifyingDatasetCore} whose quads are always exposed in the
 * default graph. Returned by {@link ProjectedDatasetCoreWrapper.match}.
 */
export interface ProjectedDatasetCore extends NotifyingDatasetCore {
    match(subject?: Term | null, predicate?: Term | null, object?: Term | null): ProjectedDatasetCore;
}

/**
 * A {@link NotifyingDatasetCore} view over an underlying dataset that
 * projects quads from one or more named graphs onto the default graph.
 *
 * - Reads come from the configured set of `readGraphs`. If `readGraphs` is
 *   `undefined`, quads from every graph (default and named) are read and the
 *   same triple appearing in multiple graphs is yielded only once.
 * - Writes ({@link ProjectedDatasetCoreWrapper.add},
 *   {@link ProjectedDatasetCoreWrapper.delete}) are mapped onto the configured
 *   `writeGraph` in the underlying dataset. Any attempt to add/delete/has a
 *   quad whose graph is not the default graph throws a `NamedGraphError`.
 * - {@link ProjectedDatasetCoreWrapper.match} ignores any graph argument and
 *   always returns quads in the default graph.
 * - `add` and `delete` listeners attached via
 *   {@link ProjectedDatasetCoreWrapper.on} are invoked with default-graph
 *   quads, and only when the projected view actually changes (a triple
 *   appearing in several read graphs is reported as added once and as
 *   deleted only once the last copy is removed).
 */
export class ProjectedDatasetCoreWrapper implements ProjectedDatasetCore {
    private readonly ee = new EE<[ChangeEvent, Quad]>()

    private _dataset: DatasetCore | null = null

    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        private readonly source: NotifyingDatasetCore,
        private readonly factory: DataFactory,
        private readonly datasetFactory: NotifyingDatasetCoreFactory,
    ) {
    }

    /** Lazily-materialized snapshot of the projected view. */
    private get dataset(): DatasetCore {
        if (this._dataset === null) {
            this._dataset = this.match()
        }
        return this._dataset
    }

    public get size(): number {
        return this.dataset.size
    }

    public [Symbol.iterator](): Iterator<Quad> {
        return this.dataset[Symbol.iterator]()
    }

    /**
     * Adds `quad` to the underlying dataset, rewriting its graph to
     * `writeGraph`. Throws if `quad` is not in the default graph.
     */
    public add(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.source.add(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    /**
     * Removes `quad` from the underlying dataset, rewriting its graph to
     * `writeGraph`. Throws if `quad` is not in the default graph.
     */
    public delete(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.source.delete(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    /**
     * Returns whether the projected view contains `quad`. Throws if `quad`
     * is not in the default graph.
     */
    public has(quad: Quad): boolean {
        ensureDefaultGraph(quad)
        return this.dataset.has(this.factory.quad(quad.subject, quad.predicate, quad.object))
    }

    /**
     * Returns a {@link ProjectedDatasetCore} containing the matching quads
     * projected onto the default graph.
     */
    public match(subject?: Term | null, predicate?: Term | null, object?: Term | null): ProjectedDatasetCore {
        return new LazyMaterializedNotifyingDatasetCore<Quad>(
            this.matchInSourceAsDefault(subject, predicate, object),
            this.datasetFactory,
        )
    }

    /** Yields source quads matching the pattern across every read graph. */
    private *matchInSource(subject?: Term | null, predicate?: Term | null, object?: Term | null): Iterable<Quad> {
        if (this.readGraphs === undefined) {
            yield* this.source.match(subject, predicate, object)
            return
        }
        for (const g of this.readGraphs) {
            yield* this.source.match(subject, predicate, object, g)
        }
    }

    /** Like {@link matchInSource}, but rewrites every quad's graph to the default graph. */
    private *matchInSourceAsDefault(subject?: Term | null, predicate?: Term | null, object?: Term | null): Iterable<Quad> {
        for (const q of this.matchInSource(subject, predicate, object)) {
            yield this.factory.quad(q.subject, q.predicate, q.object)
        }
    }

    /** Returns true when `graph` is one of the projection's read graphs. */
    private isReadGraph(graph: Quad_Graph): boolean {
        return this.readGraphs === undefined || this.readGraphs.some(g => g.equals(graph))
    }

    /**
     * Returns true when the same triple as `quad` is present in the source in
     * any read graph other than `quad.graph`. Used to determine whether an
     * `add`/`delete` event in one read graph actually changes the projected
     * view (which collapses all read graphs onto the default graph).
     */
    private existsInOtherReadGraph(quad: Quad): boolean {
        if (this.readGraphs === undefined) {
            for (const { graph } of this.source.match(quad.subject, quad.predicate, quad.object)) {
                if (!graph.equals(quad.graph)) {
                    return true
                }
            }
            return false
        }

        for (const graph of this.readGraphs) {
            if (graph.equals(quad.graph)) {
                continue
            }
            if (this.source.has(this.factory.quad(quad.subject, quad.predicate, quad.object, graph))) {
                return true
            }
        }
        return false
    }

    private readonly cb = (event: ChangeEvent, quad: Quad): void => {
        if (this.isReadGraph(quad.graph) && !this.existsInOtherReadGraph(quad)) {
            this.ee.emit(event, this.factory.quad(quad.subject, quad.predicate, quad.object))
        }
    }

    public on(listener: (event: ChangeEvent, quad: Quad) => void): void {
        if (this.ee.listeners.size === 0) {
            this.source.on(this.cb)
        }
        this.ee.on(listener)
    }

    public off(listener: (event: ChangeEvent, quad: Quad) => void): void {
        this.ee.off(listener)
        if (this.ee.listeners.size === 0) {
            this.source.off(this.cb)
        }
    }
}
