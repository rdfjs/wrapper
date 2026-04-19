import type { DataFactory, DatasetCore, DefaultGraph, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"
import type { GraphScopedDataset } from "./dataset/GraphScopedDataset.js"
import type { IGraphScopedDatasetConstructor } from "./type/IGraphScopedDatasetConstructor.js"

import { RDF } from "./vocabulary/RDF.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"
import { ensureNotifyingDatasetCore, NotifyingDatasetCore, NotifyingDatasetCoreFactory } from "./dataset/NotifyingDatasetCore.js"
import { Triple } from "./type/ITriple.js"
import { defaultGraph } from "./dataset/terms.js"
import { TermTypeError } from "./errors/TermTypeError.js"

/**
 * The view of an underlying RDF/JS dataset that {@link DatasetWrapper}
 * exposes: a {@link NotifyingDatasetCore} restricted to default-graph quads.
 *
 * {@link match} ignores the graph dimension entirely; if a non-default-graph
 * argument is passed it throws a {@link TermTypeError}.
 */
export interface DefaultDatasetCore extends DatasetCore<Triple, Triple>, NotifyingDatasetCore<Triple, Triple> {
    match(subject: Triple['subject'] | undefined, predicate: Triple['predicate'] | undefined, object: Triple['object'] | undefined, graph: DefaultGraph): DefaultDatasetCore;
}

/** Factory type used by {@link DatasetWrapper} to materialize match results. */
export type DefaultDatasetCoreFactory =
    NotifyingDatasetCoreFactory<Quad, Quad, DefaultDatasetCore>

export class DatasetWrapper implements DefaultDatasetCore {
    //#region DatasetCore

    private readonly dataset: NotifyingDatasetCore<Triple, Triple>

    /**
     * The factory used to materialize lazy match results. Subclasses receive
     * the same factory and forward it to scoped views via {@link scoped}.
     *
     * Consumers must supply a factory; this library does not bundle a
     * default implementation so it does not impose a particular RDF/JS
     * dataset implementation on its users.
     */
    protected readonly datasetFactory: DefaultDatasetCoreFactory

    public constructor(
        dataset: DatasetCore<Triple, Triple>,
        protected readonly factory: DataFactory<Triple, Triple>,
        datasetFactory: DefaultDatasetCoreFactory,
    ) {
        this.dataset = ensureNotifyingDatasetCore<Triple, Triple>(dataset)
        this.datasetFactory = datasetFactory
    }

    public get size(): number {
        // We cannot delegate to the underlying dataset's size, as it may contain quads in named graphs that are not visible through this wrapper.
        // Instead, we need to count the quads that match the default graph.
        return this.match(undefined, undefined, undefined, defaultGraph).size
    }

    public [Symbol.iterator](): Iterator<Triple> {
        return this.match(undefined, undefined, undefined, defaultGraph)[Symbol.iterator]()
    }

    public add(quad: Triple): this {
        ensureDefaultGraph(quad)
        this.dataset.add(quad)
        return this
    }

    public delete(quad: Triple): this {
        ensureDefaultGraph(quad)
        this.dataset.delete(quad)
        return this
    }

    public has(quad: Triple): boolean {
        ensureDefaultGraph(quad)
        return this.dataset.has(quad)
    }

    public match(subject: Triple['subject'] | undefined, predicate: Triple['predicate'] | undefined, object: Triple['object'] | undefined, graph: DefaultGraph): DefaultDatasetCore {
        ensureTermType(graph, "DefaultGraph")
        return this.dataset.match(subject, predicate, object, defaultGraph)
    }

    /**
     * Subscribes `listener` to be invoked whenever a quad is added to or
     * removed from the underlying dataset.
     *
     * Events are emitted for every mutation, regardless of how the mutation
     * was performed: direct calls to {@link add} / {@link delete}, mutating a
     * mapped property on a {@link TermWrapper}, mutating a {@link WrappingSet}
     * returned by a {@link SetFrom} mapping, or mutating a wrapper-managed
     * {@link RdfList}. Setters that "change" a value emit a `delete` for the
     * previous quad followed by an `add` for the new quad; clearing an
     * optional value emits only `delete`.
     *
     * Listeners receive the mutation type (`'add'` or `'delete'`) and the
     * affected quad. The wrapper does **not** deduplicate: setting a property
     * to its current value still emits a delete and an add. Use {@link off}
     * to detach a previously attached listener.
     *
     * @example Observing wrapper-driven mutations
     * ```ts
     * const events: string[] = []
     * dataset.on((event, quad) => events.push(`${event}:${quad.object.value}`))
     *
     * parent.hasString = "new"   // events: ["delete:old", "add:new"]
     * parent.hasNullableString = undefined // events: ["delete:..."]
     * dataset.add(quad)          // events: ["add:..."]
     * ```
     */
    public on(listener: Parameters<DefaultDatasetCore["on"]>[0]): void {
        this.dataset.on(listener)
    }

    /**
     * Detaches a listener previously attached with {@link on}. The listener
     * reference must be the same function that was passed to {@link on};
     * detaching an unknown listener is a no-op.
     */
    public off(...args: Parameters<DefaultDatasetCore["off"]>): void {
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

    protected* matchSubjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, predicate?: Triple['predicate'], object?: Triple['object']): Iterable<T> {
        for (const q of this.match(undefined, predicate, object, defaultGraph)) {
            yield new termWrapper(q.subject, this, this.factory)
        }
    }

    protected* matchObjectsOf<T>(termWrapper: ITermWrapperConstructor<T>, subject?: Triple['subject'], predicate?: Triple['predicate']): Iterable<T> {
        for (const q of this.match(subject, predicate, undefined, defaultGraph)) {
            yield new termWrapper(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
