import type { DataFactory, DatasetCore, DatasetFactory, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"
import { NotifyingDatasetCore } from "./NotifyingDatasetCore.js";
import { LazyMaterialize } from "./LazyMaterialize.js";

export interface ProjectedDatasetCore extends NotifyingDatasetCore {
    match(subject?: Term, predicate?: Term, object?: Term): ProjectedDatasetCore;
}

/**
 * A {@link DefaultDatasetCore} view over an underlying {@link DatasetCore} that
 * projects quads from one or more named graphs onto the default graph.
 *
 * - Reads come from the configured set of read graphs. If `readGraphs` is
 *   `undefined`, quads from every graph (default and named) are read and the
 *   same triple appearing in multiple graphs is yielded only once.
 * - Writes ({@link ProjectedDataset.add}, {@link ProjectedDataset.delete}) are
 *   mapped onto the configured `writeGraph` in the underlying dataset. Any
 *   attempt to add/delete/has a quad whose graph is not the default graph
 *   throws a {@link NamedGraphError}.
 * - {@link ProjectedDataset.match} only accepts the default graph (or no
 *   graph) as the graph argument; otherwise a {@link TermTypeError} is thrown.
 */
export class ProjectedDatasetCoreWrapper implements ProjectedDatasetCore {
    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        private readonly source: NotifyingDatasetCore,
        private readonly factory: DataFactory,
        private readonly datasetFactory: DatasetFactory,
    ) {
    }

    private _dataset: DatasetCore | null = null;

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

    public add(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.source.add(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    public delete(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.source.delete(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    public has(quad: Quad): boolean {
        ensureDefaultGraph(quad)
        return this.dataset.has(this.factory.quad(quad.subject, quad.predicate, quad.object))
    }

    public match(subject?: Term, predicate?: Term, object?: Term): ProjectedDatasetCore {
        return new LazyMaterialize(this.matchInSourceAsDefault(subject, predicate, object), this.datasetFactory)
    }

    private *matchInSource(subject?: Term, predicate?: Term, object?: Term): Iterable<Quad> {
        if (this.readGraphs === undefined) {
            return this.source.match(subject, predicate, object)
        }
        for (const g of this.readGraphs) {
            yield* this.source.match(subject, predicate, object, g)
        }
    }

    private *matchInSourceAsDefault(subject?: Term, predicate?: Term, object?: Term): Iterable<Quad> {
        for (const q of this.matchInSource(subject, predicate, object)) {
            yield this.factory.quad(q.subject, q.predicate, q.object)
        }
    }
}


