import type { DataFactory, DatasetCore, DatasetFactory, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { DefaultDatasetCore } from "./DatasetWrapper.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"

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
export class ProjectedDataset implements DefaultDatasetCore {
    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        private readonly source: DatasetCore,
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
        if (this._dataset) {
            this._dataset.add(quad)
        }
        this.source.add(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    public delete(quad: Quad): this {
        ensureDefaultGraph(quad)
        if (this._dataset) {
            this._dataset.delete(quad)
        }
        this.source.delete(this.factory.quad(quad.subject, quad.predicate, quad.object, this.writeGraph))
        return this
    }

    public has(quad: Quad): boolean {
        ensureDefaultGraph(quad)
        return this.dataset.has(this.factory.quad(quad.subject, quad.predicate, quad.object))
    }

    public match(subject?: Term, predicate?: Term, object?: Term): DefaultDatasetCore {
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

export class LazyMaterialize implements DatasetCore {
    private materialized: DatasetCore | null = null

    public constructor(private readonly source: Iterable<Quad>, private readonly datasetFactory: DatasetFactory) {
    }

    private get dataset(): DatasetCore {
        if (this.materialized === null) {
            this.materialized = this.datasetFactory.dataset()
            for (const q of this.source) {
                this.materialized.add(q)
            }
        }
        return this.materialized
    }

    [Symbol.iterator](): Iterator<Quad> {
        if (this.materialized) {
            return this.materialized[Symbol.iterator]()
        }
        return this.source[Symbol.iterator]()
    }

    get size(): number {
        if (this.materialized) {
            return this.materialized.size
        }
        let count = 0
        for (const _ of this.source) count++
        return count
    }

    add(quad: Quad): this {
        this.dataset.add(quad)
        return this
    }

    delete(quad: Quad): this {
        this.dataset.delete(quad)
        return this
    }

    has(quad: Quad): boolean {
        if (this.materialized) {
            return this.materialized.has(quad)
        }
        for (const q of this.source) {
            if (q.equals(quad)) {
                return true
            }
        }
        return false
    }

    match(subject?: Term, predicate?: Term, object?: Term): DefaultDatasetCore {
        return this.dataset.match(subject, predicate, object)
    }
}
