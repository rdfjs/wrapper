import type { BaseQuad, DataFactory, DatasetCore, DefaultGraph, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { ensureDefaultGraph } from "./ensure.js"
import { ChangeEvent, Listener, NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./NotifyingDatasetCore.js"
import { EventEmitter } from "./EventEmitter.js";
import { LazyMatchNotifyingDatasetCore } from "./LazyMaterialize.js"
import { defaultGraph } from "./DatasetWrapper.js";

export interface BaseTriple extends BaseQuad {
    graph: DefaultGraph;
}

export interface Triple extends Quad {
    graph: DefaultGraph;
}

/**
 * A {@link NotifyingDatasetCore} whose quads are always exposed in the
 * default graph. Returned by {@link ProjectedDatasetCoreWrapper.match}.
 */
export interface ProjectedDatasetCore<OutQuad extends Triple = Triple, InQuad extends BaseTriple = OutQuad> extends NotifyingDatasetCore<OutQuad, InQuad> {
    match(subject?: OutQuad['subject'], predicate?: OutQuad['predicate'], object?: OutQuad['object']): ProjectedDatasetCore<OutQuad, InQuad>;
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
 * - Listeners attached via {@link ProjectedDatasetCoreWrapper.on} are invoked
 *   with default-graph quads, and only when the projected view actually
 *   changes (a triple appearing in several read graphs is reported as added
 *   once and as deleted only once the last copy is removed).
 */
export class ProjectedDatasetCoreWrapper implements ProjectedDatasetCore<Triple, Triple> {
    private readonly ee = new EventEmitter<[ChangeEvent, Triple]>()

    private _dataset: ProjectedDatasetCore<Triple, Triple> | null = null

    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        private readonly source: NotifyingDatasetCore<Quad, Quad>,
        private readonly factory: DataFactory,
        private readonly datasetFactory: NotifyingDatasetCoreFactory<Quad, Quad, NotifyingDatasetCore<Triple, Triple>>,
    ) {
    }

    /** Lazily-materialized snapshot of the projected view. */
    private get dataset(): ProjectedDatasetCore<Triple, Triple> {
        if (this._dataset === null) {
            this._dataset = this.match()
        }
        return this._dataset
    }

    public get size(): number {
        return this.dataset.size
    }

    public [Symbol.iterator](): Iterator<Triple> {
        return this.dataset[Symbol.iterator]()
    }

    /**
     * Adds `quad` to the underlying dataset, rewriting its graph to
     * `writeGraph`. Throws if `quad` is not in the default graph.
     */
    public add(quad: Triple): this {
        ensureDefaultGraph(quad)
        this.source.add(this.inGraph(quad, this.writeGraph))
        return this
    }

    /**
     * Removes `quad` from the underlying dataset, rewriting its graph to
     * `writeGraph`. Throws if `quad` is not in the default graph.
     */
    public delete(quad: Triple): this {
        ensureDefaultGraph(quad)
        this.source.delete(this.inGraph(quad, this.writeGraph))
        return this
    }

    /**
     * Returns whether the projected view contains `quad`. Throws if `quad`
     * is not in the default graph.
     */
    public has(quad: Triple): boolean {
        ensureDefaultGraph(quad)
        if (this.readGraphs) {
            return this.readGraphs.some(g => this.source.has(this.inGraph(quad, g)))
        }
        for (const _ of this.source.match(quad.subject, quad.predicate, quad.object)) {
            return true
        }
        return false
    }

    /**
     * Returns a {@link ProjectedDatasetCore} containing the matching quads
     * projected onto the default graph.
     */
    public match(subject?: Triple['subject'], predicate?: Triple['predicate'], object?: Triple['object']): ProjectedDatasetCore<Triple, Triple> {
        return new LazyMatchNotifyingDatasetCore<Triple>(
            {
                match: (s?: Triple['subject'], p?: Triple['predicate'], o?: Triple['object']) => this.matchInSourceAsDefault(s, p, o),
                has: (quad: Triple) => this.has(quad),
                add: (quad: Triple) => this.add(quad),
                delete: (quad: Triple) => this.delete(quad),
            },
            { subject, predicate, object, graph: defaultGraph },
            this.datasetFactory,
        )
    }

    /** Yields source quads matching the pattern across every read graph. */
    private *matchInSource(subject?: Triple['subject'], predicate?: Triple['predicate'], object?: Triple['object']): Iterable<Quad> {
        if (this.readGraphs === undefined) {
            yield* this.source.match(subject, predicate, object)
            return
        }
        for (const g of this.readGraphs) {
            yield* this.source.match(subject, predicate, object, g)
        }
    }

    /** Like {@link matchInSource}, but rewrites every quad's graph to the default graph. */
    private *matchInSourceAsDefault(subject?: Triple['subject'], predicate?: Triple['predicate'], object?: Triple['object']): Iterable<Triple> {
        for (const q of this.matchInSource(subject, predicate, object)) {
            yield this.asDefault(q)
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

        return this.readGraphs.some(graph =>
            !graph.equals(quad.graph) && this.source.has(this.inGraph(quad, graph))
        )
    }

    /** Forwards a source change event to subscribers when it affects the projected view. */
    private readonly cb = (event: ChangeEvent, quad: Quad): void => {
        if (this.isReadGraph(quad.graph) && !this.existsInOtherReadGraph(quad)) {
            this.ee.emit(event, this.asDefault(quad))
        }
    }

    public on(listener: Listener<Triple>): void {
        if (this.ee.listeners.size === 0) {
            this.source.on(this.cb)
        }
        this.ee.on(listener)
    }

    public off(listener: Listener<Triple>): void {
        this.ee.off(listener)
        if (this.ee.listeners.size === 0) {
            this.source.off(this.cb)
        }
    }

    /** Returns a copy of `quad` placed in the default graph. */
    private asDefault(quad: Quad): Triple {
        return this.factory.quad(quad.subject, quad.predicate, quad.object) as Triple
    }

    /** Returns a copy of `quad` placed in `graph`. */
    private inGraph(quad: Quad, graph: Quad_Graph): Quad {
        return this.factory.quad(quad.subject, quad.predicate, quad.object, graph)
    }
}
