import type { DataFactory, DatasetCore, DatasetFactory, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"
import { NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./NotifyingDatasetCore.js";
import { LazyMaterializedNotifyingDatasetCore } from "./LazyMaterializedNotifyingDatasetCore.js";

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
    private listeners: Map<'add' | 'delete', Array<(quad: Quad) => void>> = new Map([
        ['add', []],
        ['delete', []],
    ]);


    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        private readonly source: NotifyingDatasetCore,
        private readonly factory: DataFactory,
        private readonly datasetFactory: NotifyingDatasetCoreFactory,
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
        return new LazyMaterializedNotifyingDatasetCore<Quad>(this.matchInSourceAsDefault(subject, predicate, object), this.datasetFactory)
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

    public on(name: 'add' | 'delete', listener: (quad: Quad) => void): void {
        const listeners = this.listeners.get(name)!

        if (listeners.length === 0) {
            if (name === 'add') {
                this.source.on('add', this.onAdd)
            } else {
                this.source.on('delete', this.onDelete)
            }
        }

        if (!listeners.includes(listener)) {
            listeners.push(listener)
        }
    }

    public off(name: 'add' | 'delete', listener: (quad: Quad) => void): void {
        const listeners = this.listeners.get(name)!
        listeners.splice(listeners.indexOf(listener), 1)

        if (listeners.length === 0) {
            if (name === 'add') {
                this.source.off('add', this.onAdd)
            } else {
                this.source.off('delete', this.onDelete)
            }
        }
    }

    private onAdd(quad: Quad): void {
        const listeners = this.listeners.get('add')

        // First make sure the addition is taking place on one of the graphs we are projecting from
        if (listeners && (this.readGraphs === undefined || this.readGraphs.some(g => g.equals(quad.graph)))) {
            const dfQuad = this.factory.quad(quad.subject, quad.predicate, quad.object)

            // Now make sure that the quad didn't already exist in the projected view via a different graph
            if (this.readGraphs === undefined) {
                for (const { graph } of this.source.match(quad.subject, quad.predicate, quad.object)) {
                    if (!graph.equals(quad.graph)) {
                        return
                    }
                }
            } else {
                for (const graph of this.readGraphs) {
                    if (!graph.equals(quad.graph) && this.source.has(this.factory.quad(quad.subject, quad.predicate, quad.object, graph))) {
                        return
                    }
                }
            }

            listeners.forEach(cb => cb(dfQuad))
        }
    }

    private onDelete(quad: Quad): void {
        const listeners = this.listeners.get('delete')

        if (listeners && (this.readGraphs === undefined || this.readGraphs.some(g => g.equals(quad.graph)))) {
            const dfQuad = this.factory.quad(quad.subject, quad.predicate, quad.object)

            // Now make sure that the quad doesn't still exist in the projected view via a different graph
            if (this.readGraphs === undefined) {
                for (const { graph } of this.source.match(quad.subject, quad.predicate, quad.object)) {
                    if (!graph.equals(quad.graph)) {
                        return
                    }
                }
            } else {
                for (const graph of this.readGraphs) {
                    if (!graph.equals(quad.graph) && this.source.has(this.factory.quad(quad.subject, quad.predicate, quad.object, graph))) {
                        return
                    }
                }
            }

            // Make sure the quad has actually been deleted from the projected view
            // it is possible that this may not be the case if the quad exists in multiple read graphs
            if (!this.dataset.has(dfQuad)) {
                listeners.forEach(cb => cb(dfQuad))
            }
        }
    }
}
