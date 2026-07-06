import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"
import type { NamedGraphDataset } from "./NamedGraphDataset.js"
import type { INamedGraphDatasetConstructor } from "./type/INamedGraphDatasetConstructor.js"
import type { GraphScopedDataset } from "./GraphScopedDataset.js"
import type { IGraphScopedDatasetConstructor } from "./type/IGraphScopedDatasetConstructor.js"

import { RDF } from "./vocabulary/RDF.js"

export class DatasetWrapper implements DatasetCore {
    //#region DatasetCore

    public constructor(private readonly dataset: DatasetCore, protected readonly factory: DataFactory) {
    }

    public get size(): number {
        return this.dataset.size
    }

    public* [Symbol.iterator](): Iterator<Quad> {
        yield* this.dataset
    }

    public add(quad: Quad): this {
        this.dataset.add(quad)
        return this
    }

    public delete(quad: Quad): this {
        this.dataset.delete(quad)
        return this
    }

    public has(quad: Quad): boolean {
        return this.dataset.has(quad)
    }

    public match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        return this.dataset.match(subject, predicate, object, graph)
    }

    //#endregion

    //#region Utilities

    protected subjectsOf<T>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T> {
        return this.matchSubjectsOf(termWrapper, this.factory.namedNode(predicate))
    }

    protected objectsOf<T>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T> {
        return this.matchObjectsOf(termWrapper, undefined, this.factory.namedNode(predicate))
    }

    protected instancesOf<T>(klass: string, constructor: ITermWrapperConstructor<T>): Iterable<T> {
        return this.matchSubjectsOf(constructor, this.factory.namedNode(RDF.type), this.factory.namedNode(klass))
    }

    /**
     * Creates a view over a single named graph, projecting its contents into the default graph.
     *
     * The returned dataset only exposes quads from the specified named graph, with their graph component replaced by the default graph. Writes through the view are mapped back to the named graph in the underlying dataset. Any attempt to use a non-default graph on the returned dataset throws a {@link NamedGraphError}.
     *
     * @param graph - The name of the graph to use.
     * @param klass - A constructor of a class derived from named graph dataset
     * @returns An instance of a class derived from {@link NamedGraphDataset} that is a view scoped to the specified named graph.
     */
    protected named<T extends NamedGraphDataset>(graph: string, klass: INamedGraphDatasetConstructor<T>): T
    protected named<T extends NamedGraphDataset>(graph: Quad_Graph, klass: INamedGraphDatasetConstructor<T>): T
    protected named<T extends NamedGraphDataset>(graph: string | Quad_Graph, klass: INamedGraphDatasetConstructor<T>): T {
        const g = typeof graph === "string" ? this.factory.namedNode(graph) : graph
        return new klass(g, this.dataset, this.factory)
    }

    /**
     * Creates a view over a configurable set of graphs in the underlying dataset, projected onto the default graph.
     *
     * Reads come from the supplied `readGraphs`; if `readGraphs` is `undefined`, quads from every graph (default and named) are read, and a triple appearing in multiple graphs is exposed only once. Writes through the view are mapped to `writeGraph` in the underlying dataset. Any attempt to use a non-default graph on the returned dataset throws a {@link NamedGraphError} (for write operations) or a {@link TermTypeError} (for {@link DatasetCore.match}).
     *
     * @param writeGraph - The graph that writes through the view are directed to.
     * @param readGraphs - The graphs that are read through the view, or `undefined` to read from every graph.
     * @param klass - A constructor of a class derived from graph scoped dataset
     * @returns An instance of a class derived from {@link GraphScopedDataset} that is a view scoped to the specified graphs.
     */
    protected scoped<T extends GraphScopedDataset>(writeGraph: string | Quad_Graph, readGraphs: ReadonlyArray<string | Quad_Graph> | undefined, klass: IGraphScopedDatasetConstructor<T>): T {
        const write = typeof writeGraph === "string" ? this.factory.namedNode(writeGraph) : writeGraph
        const reads = readGraphs?.map(graph => typeof graph === "string" ? this.factory.namedNode(graph) : graph)
        return new klass(write, reads, this.dataset, this.factory)
    }

    protected* matchSubjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, predicate?: Term, object?: Term, graph?: Term): Iterable<T> {
        for (const q of this.match(undefined, predicate, object, graph)) {
            yield new termWrapper(q.subject, this, this.factory)
        }
    }

    protected* matchObjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, subject?: Term, predicate?: Term, graph?: Term): Iterable<T> {
        for (const q of this.match(subject, predicate, undefined, graph)) {
            yield new termWrapper(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
