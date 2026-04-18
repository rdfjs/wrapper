import type { DataFactory, DatasetCore, DatasetFactory, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"
import type { GraphScopedDataset } from "./GraphScopedDataset.js"
import type { IGraphScopedDatasetConstructor } from "./type/IGraphScopedDatasetConstructor.js"

import { RDF } from "./vocabulary/RDF.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"
import { off } from "node:cluster"
import { ensureNotifyingDatasetCore, NotifyingDatasetCore } from "./NotifyingDatasetCore.js"

const defaultGraph: Term = Object.freeze({
    termType: "DefaultGraph",
    value: "",
    equals: (other: Term | null | undefined) => other?.termType === "DefaultGraph" && other.value === ""
});

export interface DefaultDatasetCore extends DatasetCore, NotifyingDatasetCore {
    match(subject?: Term, predicate?: Term, object?: Term): DefaultDatasetCore;
}

export class DatasetWrapper implements DefaultDatasetCore {
    //#region DatasetCore

    private readonly dataset: NotifyingDatasetCore

    public constructor(
        dataset: DatasetCore,
        protected readonly factory: DataFactory,
        protected readonly datasetFactory: DatasetFactory,
    ) {
        this.dataset = ensureNotifyingDatasetCore(dataset)
    }

    public get size(): number {
        // We cannot delegate to the underlying dataset's size, as it may contain quads in named graphs that are not visible through this wrapper.
        // Instead, we need to count the quads that match the default graph.
        return this.match().size
    }

    public* [Symbol.iterator](): Iterator<Quad> {
        yield* this.match()
    }

    public add(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.dataset.add(quad)
        return this
    }

    public delete(quad: Quad): this {
        ensureDefaultGraph(quad)
        this.dataset.delete(quad)
        return this
    }

    public has(quad: Quad): boolean {
        ensureDefaultGraph(quad)
        return this.dataset.has(quad)
    }

    public match(subject?: Term, predicate?: Term, object?: Term): DefaultDatasetCore {
        return this.dataset.match(subject, predicate, object, defaultGraph)
    }

    public on(...args: Parameters<NotifyingDatasetCore["on"]>): void {
        this.dataset.on(...args)
    }

    public off(...args: Parameters<NotifyingDatasetCore["off"]>): void {
        this.dataset.off(...args)
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
     * Creates a view over a configurable set of graphs in the underlying
     * dataset, projected onto the default graph.
     *
     * Writes through the view are mapped to `writeGraph` in the underlying
     * dataset. Reads come from the supplied `readGraphs`; if `readGraphs` is
     * `undefined`, quads from every graph (default and named) are read and
     * triples appearing in multiple graphs are yielded only once. Any attempt
     * to use a non-default graph on the returned dataset throws a
     * {@link NamedGraphError} (for write operations) or a
     * {@link TermTypeError} (for {@link DatasetCore.match}).
     *
     * @param writeGraph - The graph that writes through the view are directed
     *                     to. May be a string IRI or a {@link Quad_Graph}.
     * @param readGraphs - The graphs that are read through the view, or
     *                     `undefined` to read from every graph.
     * @param klass - A constructor of a class derived from
     *                {@link GraphScopedDataset}.
     * @returns An instance of `klass` that is a view scoped to the supplied
     *          graphs.
     */
    protected scoped<T extends GraphScopedDataset>(
        writeGraph: string | Quad_Graph,
        readGraphs: ReadonlyArray<string | Quad_Graph> | undefined,
        klass: IGraphScopedDatasetConstructor<T>,
    ): T {
        const w = typeof writeGraph === "string" ? this.factory.namedNode(writeGraph) : writeGraph
        const r = readGraphs?.map(g => typeof g === "string" ? this.factory.namedNode(g) : g)
        return new klass(w, r, this.dataset, this.factory, this.datasetFactory)
    }

    protected* matchSubjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, predicate?: Term, object?: Term): Iterable<T> {
        for (const q of this.match(undefined, predicate, object)) {
            yield new termWrapper(q.subject, this, this.factory)
        }
    }

    protected* matchObjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, subject?: Term, predicate?: Term): Iterable<T> {
        for (const q of this.match(subject, predicate, undefined)) {
            yield new termWrapper(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
