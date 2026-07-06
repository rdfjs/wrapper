import type { DataFactory, DatasetCore, Quad, Quad_Graph, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"
import type { NamedGraphDataset } from "./NamedGraphDataset.js"
import type { INamedGraphDatasetConstructor } from "./type/INamedGraphDatasetConstructor.js"
import type { TermWrapper } from "./TermWrapper.js"

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

    /**
     * Yields a wrapper around the subject of every statement with the given predicate.
     *
     * @remarks
     * The results are typed as both the wrapper and the {@link Quad.subject | subject term} they wrap, so they can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @param predicate - The IRI of the predicate to match.
     * @param termWrapper - A constructor of a class derived from {@link TermWrapper} that wraps each result.
     * @returns Wrappers around the subjects of matching statements, typed additionally as the subject terms they wrap.
     */
    protected subjectsOf<T extends TermWrapper>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T & Quad_Subject> {
        return this.matchSubjectsOf(termWrapper, this.factory.namedNode(predicate))
    }

    /**
     * Yields a wrapper around the object of every statement with the given predicate.
     *
     * @remarks
     * The results are typed as both the wrapper and the {@link Quad.object | object term} they wrap, so they can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @param predicate - The IRI of the predicate to match.
     * @param termWrapper - A constructor of a class derived from {@link TermWrapper} that wraps each result.
     * @returns Wrappers around the objects of matching statements, typed additionally as the object terms they wrap.
     */
    protected objectsOf<T extends TermWrapper>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T & Quad_Object> {
        return this.matchObjectsOf(termWrapper, undefined, this.factory.namedNode(predicate))
    }

    /**
     * Yields a wrapper around every instance of the given class, that is the subject of every statement with a predicate of `rdf:type` and the given class as the object.
     *
     * @remarks
     * The results are typed as both the wrapper and the {@link Quad.subject | subject term} they wrap, so they can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @param klass - The IRI of the class to match instances of.
     * @param constructor - A constructor of a class derived from {@link TermWrapper} that wraps each result.
     * @returns Wrappers around the instances, typed additionally as the subject terms they wrap.
     */
    protected instancesOf<T extends TermWrapper>(klass: string, constructor: ITermWrapperConstructor<T>): Iterable<T & Quad_Subject> {
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
     * Yields a wrapper around the subject of every statement matching the given pattern.
     *
     * @remarks
     * The results are typed as both the wrapper and the {@link Quad.subject | subject term} they wrap, so they can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @param termWrapper - A constructor of a class derived from {@link TermWrapper} that wraps each result.
     * @param predicate - The predicate to match, if any.
     * @param object - The object to match, if any.
     * @param graph - The graph to match, if any.
     * @returns Wrappers around the subjects of matching statements, typed additionally as the subject terms they wrap.
     */
    protected* matchSubjectsOf<T extends TermWrapper>(termWrapper: ITermWrapperConstructor<T>, predicate?: Term, object?: Term, graph?: Term): Iterable<T & Quad_Subject> {
        for (const q of this.match(undefined, predicate, object, graph)) {
            yield termWrapper.from(q.subject, this, this.factory)
        }
    }

    /**
     * Yields a wrapper around the object of every statement matching the given pattern.
     *
     * @remarks
     * The results are typed as both the wrapper and the {@link Quad.object | object term} they wrap, so they can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @param termWrapper - A constructor of a class derived from {@link TermWrapper} that wraps each result.
     * @param subject - The subject to match, if any.
     * @param predicate - The predicate to match, if any.
     * @param graph - The graph to match, if any.
     * @returns Wrappers around the objects of matching statements, typed additionally as the object terms they wrap.
     */
    protected* matchObjectsOf<T extends TermWrapper>(termWrapper: ITermWrapperConstructor<T>, subject?: Term, predicate?: Term, graph?: Term): Iterable<T & Quad_Object> {
        for (const q of this.match(subject, predicate, undefined, graph)) {
            yield termWrapper.from(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
