import type { AsyncDatasetCore, DataFactory, Quad, Term } from "@rdfjs/types"
import type { DatasetCoreSource } from "@jeswr/async-dataset"
import type { IAsyncTermWrapperConstructor } from "./type/IAsyncTermWrapperConstructor.js"

import { AsyncDatasetCore as SyncBackedAsyncDatasetCore } from "@jeswr/async-dataset"
import { RDF } from "../vocabulary/RDF.js"

/**
 * Asynchronous counterpart of {@link DatasetWrapper}: implements the RDF/JS {@link AsyncDatasetCore} interface by delegation and offers the same protected query helpers, so mapping classes can be projected out of datasets whose contents cannot be read synchronously - for example datasets backed by disk or by remote storage.
 *
 * @remarks
 * The wrapped dataset can be an {@link AsyncDatasetCore}, or any synchronous RDF/JS `DatasetCore` source ({@link DatasetCoreSource}: an instance, a promise of one, or a function lazily producing one). Synchronous sources are adapted to the asynchronous surface automatically, so existing stores (e.g. an n3 `Store`) can be used unchanged.
 *
 * On the asynchronous surface, {@link size}, {@link add}, {@link delete} and {@link has} return promises, quads are consumed with `for await`, and {@link match} returns a (potentially lazily evaluated) {@link AsyncDatasetCore} view.
 *
 * The protected helpers ({@link subjectsOf}, {@link objectsOf}, {@link instancesOf}, {@link matchSubjectsOf}, {@link matchObjectsOf}) mirror those of {@link DatasetWrapper} but return `AsyncIterable`s of mapping class instances constructed from an {@link IAsyncTermWrapperConstructor}.
 *
 * @example Projecting instances out of an asynchronous dataset
 * Given the RDF
 * ```turtle
 * prefix : <https://example.org/>
 *
 * <alice> a :Person ; :name "Alice" .
 * <bob> a :Person ; :name "Bob" .
 * ```
 *
 * and the mapping
 * ```ts
 * class Person {
 *     public constructor(
 *         private readonly term: Term,
 *         private readonly dataset: AsyncDatasetCore,
 *         private readonly factory: DataFactory,
 *     ) {
 *     }
 *
 *     public get name(): Promise<string | undefined> {
 *         return (async () => {
 *             for await (const quad of this.dataset.match(this.term, this.factory.namedNode("https://example.org/name"))) {
 *                 return quad.object.value
 *             }
 *             return undefined
 *         })()
 *     }
 * }
 *
 * class People extends AsyncDatasetWrapper {
 *     public get all(): AsyncIterable<Person> {
 *         return this.instancesOf("https://example.org/Person", Person)
 *     }
 * }
 * ```
 *
 * this code
 * ```ts
 * const people = new People(asyncDataset, factory)
 * for await (const person of people.all) {
 *     console.log(await person.name)
 * }
 * ```
 *
 * will print (not necessarily in this order)
 * ```txt
 * Alice
 * Bob
 * ```
 *
 * @example Wrapping a synchronous store
 * Any synchronous RDF/JS `DatasetCore` (or a promise of one, or a function lazily producing one) is adapted automatically:
 * ```ts
 * const people = new People(new Store(), factory)
 * console.log(await people.size)
 * ```
 *
 * @see
 * - {@link https://rdf.js.org/dataset-spec/ | RDF/JS Dataset specification}
 * - {@link DatasetWrapper}
 * - {@link IAsyncTermWrapperConstructor}
 */
export class AsyncDatasetWrapper implements AsyncDatasetCore {
    private readonly dataset: AsyncDatasetCore

    public constructor(dataset: AsyncDatasetCore | DatasetCoreSource, protected readonly factory: DataFactory) {
        this.dataset = AsyncDatasetWrapper.isAsyncDatasetCore(dataset) ? dataset : new SyncBackedAsyncDatasetCore(dataset)
    }

    private static isAsyncDatasetCore(dataset: AsyncDatasetCore | DatasetCoreSource): dataset is AsyncDatasetCore {
        return typeof dataset === "object" && Symbol.asyncIterator in dataset
    }

    //#region AsyncDatasetCore

    public get size(): Promise<number> {
        return this.dataset.size
    }

    public [Symbol.asyncIterator](): AsyncIterator<Quad> {
        return this.dataset[Symbol.asyncIterator]()
    }

    public async add(quad: Quad): Promise<this> {
        await this.dataset.add(quad)
        return this
    }

    public async delete(quad: Quad): Promise<this> {
        await this.dataset.delete(quad)
        return this
    }

    public has(quad: Quad): Promise<boolean> {
        return this.dataset.has(quad)
    }

    public match(subject?: Term | null, predicate?: Term | null, object?: Term | null, graph?: Term | null): AsyncDatasetCore {
        return this.dataset.match(subject, predicate, object, graph)
    }

    //#endregion

    //#region Utilities

    /**
     * Projects the subjects of all quads with the given predicate into instances of a mapping class.
     *
     * @param predicate - The IRI of the predicate to match.
     * @param termWrapper - The constructor of the mapping class to project subjects into.
     * @returns An asynchronous sequence of mapping class instances, one per matching quad.
     */
    protected subjectsOf<T>(predicate: string, termWrapper: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchSubjectsOf(termWrapper, this.factory.namedNode(predicate))
    }

    /**
     * Projects the objects of all quads with the given predicate into instances of a mapping class.
     *
     * @param predicate - The IRI of the predicate to match.
     * @param termWrapper - The constructor of the mapping class to project objects into.
     * @returns An asynchronous sequence of mapping class instances, one per matching quad.
     */
    protected objectsOf<T>(predicate: string, termWrapper: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchObjectsOf(termWrapper, undefined, this.factory.namedNode(predicate))
    }

    /**
     * Projects the instances of the given class (subjects of `rdf:type` quads with the class as object) into instances of a mapping class.
     *
     * @param klass - The IRI of the RDFS class whose instances to match.
     * @param constructor - The constructor of the mapping class to project instances into.
     * @returns An asynchronous sequence of mapping class instances, one per matching quad.
     */
    protected instancesOf<T>(klass: string, constructor: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchSubjectsOf(constructor, this.factory.namedNode(RDF.type), this.factory.namedNode(klass))
    }

    /**
     * Projects the subjects of all quads matching the given pattern into instances of a mapping class.
     *
     * @param termWrapper - The constructor of the mapping class to project subjects into.
     * @param predicate - The optional exact predicate to match.
     * @param object - The optional exact object to match.
     * @param graph - The optional exact graph to match.
     * @returns An asynchronous sequence of mapping class instances, one per matching quad.
     */
    protected async* matchSubjectsOf<T>(termWrapper: IAsyncTermWrapperConstructor<T>, predicate?: Term, object?: Term, graph?: Term): AsyncIterable<T> {
        for await (const q of this.match(undefined, predicate, object, graph)) {
            yield new termWrapper(q.subject, this, this.factory)
        }
    }

    /**
     * Projects the objects of all quads matching the given pattern into instances of a mapping class.
     *
     * @param termWrapper - The constructor of the mapping class to project objects into.
     * @param subject - The optional exact subject to match.
     * @param predicate - The optional exact predicate to match.
     * @param graph - The optional exact graph to match.
     * @returns An asynchronous sequence of mapping class instances, one per matching quad.
     */
    protected async* matchObjectsOf<T>(termWrapper: IAsyncTermWrapperConstructor<T>, subject?: Term, predicate?: Term, graph?: Term): AsyncIterable<T> {
        for await (const q of this.match(subject, predicate, undefined, graph)) {
            yield new termWrapper(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
