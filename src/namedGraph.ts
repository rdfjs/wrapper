import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { NamedGraphError } from "./errors/NamedGraphError.js"

class NamedGraphDataset implements DatasetCore {
    private graphViewCache: DatasetCore | undefined

    constructor(private readonly graph: Quad_Graph, private readonly dataset: DatasetCore, private readonly factory: DataFactory) {
    }

    private get graphView(): DatasetCore {
        return this.graphViewCache ??= this.dataset.match(undefined, undefined, undefined, this.graph)
    }

    private invalidateCache(): void {
        this.graphViewCache = undefined
    }

    get size(): number {
        return this.graphView.size
    }

    *[Symbol.iterator](): Iterator<Quad> {
        for (const quad of this.graphView) {
            yield this.factory.quad(quad.subject, quad.predicate, quad.object)
        }
    }

    add(quad: Quad): this {
        this.ensureDefaultGraph(quad)
        this.dataset.add(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
        this.invalidateCache()
        return this
    }

    delete(quad: Quad): this {
        this.ensureDefaultGraph(quad)
        this.dataset.delete(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
        this.invalidateCache()
        return this
    }

    has(quad: Quad): boolean {
        this.ensureDefaultGraph(quad)
        return this.dataset.has(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
    }

    match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        if (graph && graph.termType !== "DefaultGraph") {
            throw new NamedGraphError()
        }

        return new NamedGraphDataset(this.graph, this.dataset.match(subject, predicate, object, this.graph), this.factory)
    }

    private ensureDefaultGraph(quad: Quad): void {
        if (quad.graph.termType !== "DefaultGraph") {
            throw new NamedGraphError()
        }
    }
}

/**
 * Creates a {@link DatasetCore} view over a single named graph, projecting its contents into the default graph.
 *
 * The returned dataset only exposes quads from the specified named graph, with their graph component
 * replaced by the default graph. Writes through the view are mapped back to the named graph in the
 * underlying dataset. Any attempt to use a non-default graph on the returned dataset throws a
 * {@link NamedGraphError}.
 *
 * @param graph - The graph to project as a {@link Quad_Graph}.
 * @param dataset - The underlying dataset containing quads in one or more named graphs.
 * @param factory - A {@link DataFactory} used to construct quads.
 * @returns A {@link DatasetCore} view scoped to the specified named graph.
 *
 * @example
 * ```ts
 * const view = namedGraph(DataFactory.namedNode("https://example.org/graph1"), dataset, DataFactory)
 * for (const quad of view) {
 *     console.log(quad.graph.termType) // "DefaultGraph"
 * }
 * ```
 */
export function namedGraph(graph: Quad_Graph, dataset: DatasetCore, factory: DataFactory): DatasetCore {
    return new NamedGraphDataset(graph, dataset, factory)
}
