import type { EventfulDatasetCore } from "@jeswr/eventful-dataset"
import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"
import type { IDatasetChangeListener } from "./type/IDatasetChangeListener.js"
import type { NamedGraphDataset } from "./NamedGraphDataset.js"
import type { INamedGraphDatasetConstructor } from "./type/INamedGraphDatasetConstructor.js"
import type { GraphScopedDataset } from "./GraphScopedDataset.js"
import type { IGraphScopedDatasetConstructor } from "./type/IGraphScopedDatasetConstructor.js"

import { ensureEventfulDatasetCore } from "./ensure.js"
import { RDF } from "./vocabulary/RDF.js"

export class DatasetWrapper implements DatasetCore {
    //#region DatasetCore

    private readonly dataset: EventfulDatasetCore<Quad>

    /**
     * Creates a new instance of {@link DatasetWrapper}.
     *
     * @param dataset - The dataset being wrapped. Mutations performed through this wrapper write through to it and notify listeners attached with {@link on}.
     * @param factory - A collection of methods for creating terms.
     */
    public constructor(dataset: DatasetCore, protected readonly factory: DataFactory) {
        this.dataset = ensureEventfulDatasetCore(dataset)
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

    //#region Events

    private readonly listeners = new Map<IDatasetChangeListener, { added(quad: Quad): void, deleted(quad: Quad): void }>()

    /**
     * Subscribes `listener` to change notifications for the underlying dataset.
     *
     * The listener is invoked synchronously with the type of the change (`"add"` or `"delete"`) and the affected quad whenever the contents of the dataset effectively change, regardless of how the mutation was performed: direct calls to {@link add} or {@link delete}, assigning a mapped property on a {@link TermWrapper}, or mutating a {@link Set} returned by a {@link SetFrom} mapping.
     *
     * @remarks
     * - Only effective changes are notified: adding a quad that the dataset already contains, or deleting one that it does not, does not invoke the listener.
     * - Property assignments do not deduplicate: mutators remove existing quads before adding the new one, so assigning a value emits a `"delete"` notification for every quad previously matching the property (if any), followed by an `"add"` notification for the new quad - even when the assigned value equals the current one. Clearing an optional property (assigning `undefined`) emits only `"delete"` notifications.
     * - Subscribing a listener that is already subscribed has no effect. Listeners are notified in subscription order.
     * - Only mutations performed through this wrapper (or through another wrapper sharing the same underlying eventful dataset, such as views created by {@link named}) are observed. Mutating the wrapped dataset directly does not notify listeners.
     *
     * @param listener - The callback to invoke with every change to the contents of the dataset.
     *
     * @example Observing property assignments
     * Assume the following RDF data:
     * ```turtle
     * BASE <http://example.com/>
     *
     * <someSubject> <someProperty> "some value" .
     * ```
     *
     * Given the mapping
     * ```ts
     * class SomeClass extends TermWrapper {
     *   set someProperty(value: string) {
     *     RequiredAs.object(this, "http://example.com/someProperty", value, LiteralFrom.string)
     *   }
     * }
     * ```
     *
     * mutations can be observed as follows:
     * ```ts
     * const wrapper = new DatasetWrapper(dataset, DataFactory) // which has the RDF above loaded
     * wrapper.on((event, quad) => console.log(`${event} ${quad.object.value}`))
     *
     * const instance = new SomeClass("http://example.com/someSubject", wrapper, DataFactory)
     * instance.someProperty = "some other value"
     * // logs `delete some value` followed by `add some other value`
     * ```
     *
     * @example Observing direct mutations
     * ```ts
     * const wrapper = new DatasetWrapper(dataset, DataFactory)
     * wrapper.on((event, quad) => console.log(event))
     *
     * wrapper.add(someQuad)    // logs `add` (unless the dataset already contained the quad)
     * wrapper.delete(someQuad) // logs `delete`
     * ```
     *
     * @see
     * - {@link off} for detaching the listener.
     * - {@link IDatasetChangeListener} for the listener signature.
     * - [RDF/JS: Dataset specification](https://rdf.js.org/dataset-spec/)
     */
    public on(listener: IDatasetChangeListener): void {
        if (this.listeners.has(listener)) {
            return
        }

        const handlers = {
            added: (quad: Quad) => listener("add", quad),
            deleted: (quad: Quad) => listener("delete", quad),
        }

        this.listeners.set(listener, handlers)
        this.dataset.on("add", handlers.added)
        this.dataset.on("delete", handlers.deleted)
    }

    /**
     * Unsubscribes `listener` from change notifications for the underlying dataset.
     *
     * @remarks
     * The argument must be the same function reference that was passed to {@link on}. Detaching a listener that is not subscribed has no effect.
     *
     * @param listener - The callback to detach.
     *
     * @see
     * - {@link on} for attaching a listener.
     */
    public off(listener: IDatasetChangeListener): void {
        const handlers = this.listeners.get(listener)

        if (handlers === undefined) {
            return
        }

        this.listeners.delete(listener)
        this.dataset.off("add", handlers.added)
        this.dataset.off("delete", handlers.deleted)
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
