import type { DataFactory, DatasetCore, Quad, Quad_Graph, Term } from "@rdfjs/types"
import { DatasetWrapper } from "./DatasetWrapper.js"
import { ensureDefaultGraph, ensureTermType } from "./ensure.js"

export class NamedGraphDataset extends DatasetWrapper {
    constructor(private readonly graph: Quad_Graph, dataset: DatasetCore, factory: DataFactory) {
        super(dataset, factory)
    }

    override get size(): number {
        return super.match(undefined, undefined, undefined, this.graph).size
    }

    override* [Symbol.iterator](): Iterator<Quad> {
        for (const quad of super.match(undefined, undefined, undefined, this.graph)) {
            yield this.factory.quad(quad.subject, quad.predicate, quad.object)
        }
    }

    override add(quad: Quad): this {
        ensureDefaultGraph(quad)

        super.add(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
        return this
    }

    override delete(quad: Quad): this {
        ensureDefaultGraph(quad)

        super.delete(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
        return this
    }

    override has(quad: Quad): boolean {
        ensureDefaultGraph(quad)

        return super.has(this.factory.quad(quad.subject, quad.predicate, quad.object, this.graph))
    }

    override match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        if (graph !== undefined) {
            ensureTermType(graph, "DefaultGraph")
        }

        return new NamedGraphDataset(this.graph, super.match(subject, predicate, object, this.graph), this.factory)
    }
}
