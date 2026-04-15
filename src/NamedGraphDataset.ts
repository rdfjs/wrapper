import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { DatasetWrapper } from "./DatasetWrapper.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"

export class NamedGraphDataset extends DatasetWrapper {
    constructor(private readonly graph: Quad_Graph, dataset: DatasetCore, factory: DataFactory) {
        super(dataset, factory)
    }

    override get size(): number {
        return this.subGraph.size
    }

    override* [Symbol.iterator](): Iterator<Quad> {
        for (const quad of this.subGraph) {
            yield this.asDefault(quad)
        }
    }

    override add(quad: Quad): this {
        super.add(this.asNamed(quad))
        return this
    }

    override delete(quad: Quad): this {
        super.delete(this.asNamed(quad))
        return this
    }

    override has(quad: Quad): boolean {
        return super.has(this.asNamed(quad))
    }

    override match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        if (graph !== undefined) {
            ensureTermType(graph, "DefaultGraph")
        }

        return new NamedGraphDataset(this.graph, super.match(subject, predicate, object, this.graph), this.factory)
    }

    private get subGraph(): DatasetCore {
        return super.match(undefined, undefined, undefined, this.graph);
    }

    private asNamed(quad: Quad): Quad {
        ensureDefaultGraph(quad)

        return this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph)
    }

    private asDefault(quad: Quad): Quad {
        return this.factory.quad(quad.subject, quad.predicate, quad.object);
    }
}
