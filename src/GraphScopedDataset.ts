import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import type { IDatasetChangeListener } from "./type/IDatasetChangeListener.js"
import { DatasetWrapper } from "./DatasetWrapper.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"

/**
 * A dataset view that reads from a configurable set of graphs and writes to a single graph.
 *
 * Quads read through the view are projected onto the default graph: their graph component is replaced by the default graph, and a triple that occurs in more than one read graph is exposed only once. Quads written through the view ({@link add}, {@link delete}) are mapped back to the configured write graph in the underlying dataset.
 *
 * @remarks
 * This class generalizes {@link NamedGraphDataset}, which is the special case of reading from and writing to the same single graph. It addresses the common asymmetry in RDF applications where data is assembled from several graphs (for example, a union over every graph in the dataset) but changes must land in one designated graph.
 *
 * Because the projection rewrites every read quad to the default graph, {@link TermWrapper} and {@link DatasetWrapper} subclasses that operate on the default graph work unchanged against quads that live in named graphs.
 *
 * Change notifications ({@link on} / {@link off}) follow the projection as well: listeners observe the view's default-graph surface, so a triple occurring in several read graphs is reported as added only once and as deleted only when its last copy disappears from the read scope.
 *
 * The view enforces the default graph on its own surface:
 * - {@link add}, {@link delete} and {@link has} throw a {@link NamedGraphError} when the supplied quad is not in the default graph.
 * - {@link match} throws a {@link TermTypeError} when the graph argument is present and not the default graph.
 *
 * @example Reading a union of all graphs while writing to one graph
 * Assume the following RDF data:
 * ```turtle
 * BASE <https://example.org/>
 * PREFIX : <https://example.org/>
 *
 * <x> :hasString "from the default graph" .
 *
 * :g1 { <x> :hasString "from g1" . }
 * :g2 { <x> :hasString "from g2" . }
 * ```
 *
 * A read scope of `undefined` reads every graph; writes are directed to one graph:
 * ```ts
 * class SomeDataset extends DatasetWrapper {
 *     get union(): GraphScopedDataset {
 *         return this.scoped("https://example.org/g1", undefined, GraphScopedDataset)
 *     }
 * }
 *
 * const union = new SomeDataset(dataset, factory).union
 *
 * union.size // 3 — one triple per distinct value, all projected onto the default graph
 * union.add(quad) // written to <https://example.org/g1> in the underlying dataset
 * ```
 *
 * @example Reading selected graphs
 * Passing an explicit read scope restricts reads to those graphs:
 * ```ts
 * class SomeDataset extends DatasetWrapper {
 *     get merged(): GraphScopedDataset {
 *         return this.scoped("https://example.org/g1", ["https://example.org/g1", "https://example.org/g2"], GraphScopedDataset)
 *     }
 * }
 *
 * const merged = new SomeDataset(dataset, factory).merged
 *
 * merged.size // 2 — the default-graph triple is out of scope
 * ```
 *
 * @example Reusing term wrappers over named-graph data
 * Subclasses extend this class the same way they extend {@link DatasetWrapper}:
 * ```ts
 * class People extends GraphScopedDataset {
 *     get all(): Iterable<Person> {
 *         return this.subjectsOf("https://example.org/hasName", Person)
 *     }
 * }
 *
 * class Workspace extends DatasetWrapper {
 *     people(graph: string): People {
 *         return this.scoped(graph, undefined, People)
 *     }
 * }
 * ```
 *
 * @see {@link DatasetWrapper.scoped} — the recommended way to obtain instances.
 * @see {@link NamedGraphDataset} — the single-graph special case.
 * @see [RDF/JS Dataset specification](https://rdf.js.org/dataset-spec/) — the contract implemented by this view.
 */
export class GraphScopedDataset extends DatasetWrapper {
    //#region DatasetCore

    /**
     * Creates a new instance of {@link GraphScopedDataset}.
     *
     * Application code typically does not call this constructor directly but obtains instances through {@link DatasetWrapper.scoped}, which resolves graph IRIs and forwards the underlying dataset and factory.
     *
     * @param writeGraph The graph in the underlying dataset that writes through this view are directed to.
     * @param readGraphs The graphs read through this view. If `undefined`, every graph in the underlying dataset is read (a deduplicated union).
     * @param dataset The underlying dataset to project.
     * @param factory A collection of methods for creating the rewritten quads.
     */
    public constructor(
        private readonly writeGraph: Quad_Graph,
        private readonly readGraphs: ReadonlyArray<Quad_Graph> | undefined,
        dataset: DatasetCore,
        factory: DataFactory,
    ) {
        super(dataset, factory)
    }

    /**
     * The number of distinct triples visible through the read scope.
     */
    public override get size(): number {
        let size = 0

        for (const _ of this) {
            size += 1
        }

        return size
    }

    /**
     * Iterates the triples in the read scope, projected onto the default graph. A triple occurring in more than one read graph is yielded only once.
     */
    public override* [Symbol.iterator](): Iterator<Quad> {
        const seen = new Set<string>()

        for (const quad of this.readScope()) {
            const key = GraphScopedDataset.keyOf(quad)

            if (!seen.has(key)) {
                seen.add(key)
                yield this.asDefault(quad)
            }
        }
    }

    /**
     * Adds `quad` to the underlying dataset, rewriting its graph to the write graph.
     *
     * @throws A {@link NamedGraphError} when `quad` is not in the default graph.
     */
    public override add(quad: Quad): this {
        ensureDefaultGraph(quad)
        super.add(this.inGraph(quad, this.writeGraph))
        return this
    }

    /**
     * Removes `quad` from the write graph of the underlying dataset. Copies of the same triple in other graphs are left untouched.
     *
     * @throws A {@link NamedGraphError} when `quad` is not in the default graph.
     */
    public override delete(quad: Quad): this {
        ensureDefaultGraph(quad)
        super.delete(this.inGraph(quad, this.writeGraph))
        return this
    }

    /**
     * Returns whether any graph in the read scope contains `quad`.
     *
     * @throws A {@link NamedGraphError} when `quad` is not in the default graph.
     */
    public override has(quad: Quad): boolean {
        ensureDefaultGraph(quad)

        if (this.readGraphs === undefined) {
            return super.match(quad.subject, quad.predicate, quad.object).size > 0
        }

        return this.readGraphs.some(graph => super.has(this.inGraph(quad, graph)))
    }

    /**
     * Returns a {@link GraphScopedDataset} with the matching triples of the read scope, projected onto the default graph.
     *
     * @throws A {@link TermTypeError} when `graph` is present and not the default graph.
     */
    public override match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        if (graph !== undefined) {
            ensureTermType(graph, "DefaultGraph")
        }

        return new GraphScopedDataset(this.writeGraph, this.readGraphs, super.match(subject, predicate, object), this.factory)
    }

    //#endregion

    //#region Events

    /**
     * Listeners subscribed via {@link on}, notified in subscription order.
     */
    private readonly scopedListeners = new Set<IDatasetChangeListener>()

    /**
     * The single callback this view keeps subscribed to the underlying dataset while at least one listener is attached.
     *
     * Forwards a change to the subscribers only when it affects the projected view - see {@link on} - with the quad projected onto the default graph.
     */
    private readonly changed: IDatasetChangeListener = (event, quad) => {
        if (!this.isReadGraph(quad.graph) || this.existsInOtherReadGraph(quad)) {
            return
        }

        const projected = this.asDefault(quad)

        for (const listener of this.scopedListeners) {
            listener(event, projected)
        }
    }

    /**
     * Subscribes `listener` to change notifications for the projected view.
     *
     * The listener is invoked synchronously with the type of the change (`"add"` or `"delete"`) and the affected quad whenever the contents of the view effectively change, regardless of which read graph the change happened in. Quads are delivered projected onto the default graph, like all reads through the view.
     *
     * @remarks
     * - Only changes visible through the projection are notified. Because the view collapses every read graph onto the default graph, a triple occurring in several read graphs is reported as added only once - when its first copy appears - and as deleted only once - when its last copy disappears. Adding a copy of a triple that another read graph already contains, or deleting a copy while another read graph still holds one, does not invoke the listener.
     * - Changes to graphs outside the read scope are not reported.
     * - Writes performed through the view itself are observed like any other change: {@link add} stores the quad in the write graph, and the listener receives it projected onto the default graph (provided the write graph is within the read scope).
     * - The view observes the underlying dataset lazily: the first subscription attaches a single shared callback (via {@link DatasetWrapper.on}) and the last {@link off} detaches it.
     * - Only mutations performed through a wrapper sharing the same underlying eventful dataset are observed: the wrapper this view was created from, the view itself, or sibling views. Mutating the wrapped dataset directly does not notify listeners.
     * - Subscribing a listener that is already subscribed has no effect. Listeners are notified in subscription order.
     *
     * @param listener - The callback to invoke with every change to the contents of the view.
     *
     * @example Cross-graph deduplication
     * Assume the following RDF data:
     * ```turtle
     * BASE <https://example.org/>
     * PREFIX : <https://example.org/>
     *
     * :g1 { <x> :hasString "shared" . }
     * ```
     *
     * A view reading `:g1` and `:g2` reports each triple as added once and as deleted only when the last copy disappears:
     * ```ts
     * class SomeDataset extends DatasetWrapper {
     *   get merged(): GraphScopedDataset {
     *     return this.scoped("https://example.org/g1", ["https://example.org/g1", "https://example.org/g2"], GraphScopedDataset)
     *   }
     * }
     *
     * const wrapper = new SomeDataset(dataset, factory) // which has the RDF above loaded
     * const merged = wrapper.merged
     * merged.on((event, quad) => console.log(`${event} ${quad.object.value}`))
     *
     * const shared = (graph: Quad_Graph) => factory.quad(x, hasString, factory.literal("shared"), graph)
     *
     * wrapper.add(shared(g2))    // logs nothing - the triple was already visible through g1
     * wrapper.delete(shared(g1)) // logs nothing - the copy in g2 still backs the view
     * wrapper.delete(shared(g2)) // logs `delete shared` - the last copy disappeared
     * ```
     *
     * @example Observing writes through the view
     * ```ts
     * const merged = wrapper.merged
     * merged.on((event, quad) => console.log(event, quad.graph.termType))
     *
     * // The quad is stored in g1 (the write graph) but delivered projected onto the default graph.
     * merged.add(factory.quad(x, hasString, factory.literal("new"))) // logs `add DefaultGraph`
     * ```
     *
     * @see
     * - {@link off} for detaching the listener.
     * - {@link DatasetWrapper.on} for observing the underlying dataset without projection.
     * - {@link IDatasetChangeListener} for the listener signature.
     * - [RDF/JS: Dataset specification](https://rdf.js.org/dataset-spec/)
     */
    public override on(listener: IDatasetChangeListener): void {
        if (this.scopedListeners.has(listener)) {
            return
        }

        if (this.scopedListeners.size === 0) {
            super.on(this.changed)
        }

        this.scopedListeners.add(listener)
    }

    /**
     * Unsubscribes `listener` from change notifications for the projected view.
     *
     * @remarks
     * The argument must be the same function reference that was passed to {@link on}. Detaching a listener that is not subscribed has no effect. When the last listener is detached, the view also detaches its own callback from the underlying dataset.
     *
     * @param listener - The callback to detach.
     *
     * @see
     * - {@link on} for attaching a listener.
     */
    public override off(listener: IDatasetChangeListener): void {
        if (!this.scopedListeners.delete(listener)) {
            return
        }

        if (this.scopedListeners.size === 0) {
            super.off(this.changed)
        }
    }

    //#endregion

    //#region Utilities

    /**
     * Returns whether `graph` is within the read scope of this view.
     */
    private isReadGraph(graph: Quad_Graph): boolean {
        return this.readGraphs === undefined || this.readGraphs.some(other => other.equals(graph))
    }

    /**
     * Returns whether the triple of `quad` also occurs in a read graph other than `quad.graph`.
     *
     * Used to decide whether a change to one read graph is visible through the projection: because the view collapses every read graph onto the default graph, adding a copy of a triple that another read graph already contains, or deleting one of several copies, does not change the view.
     */
    private existsInOtherReadGraph(quad: Quad): boolean {
        if (this.readGraphs === undefined) {
            for (const { graph } of super.match(quad.subject, quad.predicate, quad.object)) {
                if (!graph.equals(quad.graph)) {
                    return true
                }
            }

            return false
        }

        return this.readGraphs.some(graph => !graph.equals(quad.graph) && super.has(this.inGraph(quad, graph)))
    }

    /**
     * Yields the quads of the underlying dataset that are within the read scope, in their original graphs.
     */
    private* readScope(): Iterable<Quad> {
        if (this.readGraphs === undefined) {
            yield* super.match()
            return
        }

        for (const graph of this.readGraphs) {
            yield* super.match(undefined, undefined, undefined, graph)
        }
    }

    /**
     * Returns a copy of `quad` placed in `graph`.
     */
    private inGraph(quad: Quad, graph: Quad_Graph): Quad {
        return this.factory.quad(quad.subject, quad.predicate, quad.object, graph)
    }

    /**
     * Returns a copy of `quad` placed in the default graph.
     */
    private asDefault(quad: Quad): Quad {
        return this.factory.quad(quad.subject, quad.predicate, quad.object)
    }

    /**
     * Derives a string key that identifies the triple components of `quad` (its graph is ignored), so that quads whose subjects, predicates and objects are equal per [Term.equals](https://rdf.js.org/data-model-spec/#dfn-equals) map to the same key.
     */
    private static keyOf(quad: Quad): string {
        return `${GraphScopedDataset.termKey(quad.subject)} ${GraphScopedDataset.termKey(quad.predicate)} ${GraphScopedDataset.termKey(quad.object)}`
    }

    /**
     * Derives a string key that identifies a term by value, so that terms equal per [Term.equals](https://rdf.js.org/data-model-spec/#dfn-equals) map to the same key.
     */
    private static termKey(term: Term): string {
        switch (term.termType) {
            case "Literal":
                return `${term.termType} ${term.language} ${term.direction ?? ""} ${JSON.stringify(term.datatype.value)} ${JSON.stringify(term.value)}`
            case "Quad":
                return `${term.termType} ${GraphScopedDataset.termKey(term.subject)} ${GraphScopedDataset.termKey(term.predicate)} ${GraphScopedDataset.termKey(term.object)} ${GraphScopedDataset.termKey(term.graph)}`
            default:
                return `${term.termType} ${JSON.stringify(term.value)}`
        }
    }

    //#endregion
}
