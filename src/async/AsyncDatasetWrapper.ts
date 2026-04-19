import type { DataFactory, DatasetCore, DefaultGraph, Quad } from "@rdfjs/types"
import type { Triple } from "../type/ITriple.js"
import type { AsyncDefaultDatasetCore, AsyncListener, AsyncNotifyingDatasetCore, AsyncNotifyingDatasetCoreFactory } from "./AsyncNotifyingDatasetCore.js"
import type { IAsyncTermWrapperConstructor } from "./type/IAsyncTermWrapperConstructor.js"

import { ensureAsyncNotifyingDatasetCore } from "./AsyncNotifyingDatasetCore.js"
import { defaultGraph } from "../dataset/terms.js"
import { ensureDefaultGraph, ensureTermType } from "../ensure.js"
import { RDF } from "../vocabulary/RDF.js"

/**
 * Asynchronous projection of an underlying dataset onto its default
 * graph - the async counterpart to
 * {@link "../DatasetWrapper.js"!DefaultDatasetCore}.
 */
export interface AsyncDefaultNotifyingDatasetCore
    extends AsyncDefaultDatasetCore<Triple> {
    match(
        subject: Triple["subject"] | undefined,
        predicate: Triple["predicate"] | undefined,
        object: Triple["object"] | undefined,
        graph: DefaultGraph,
    ): AsyncDefaultNotifyingDatasetCore
}

/** Factory used by {@link AsyncDatasetWrapper} to materialise scoped views. */
export type AsyncDefaultDatasetCoreFactory =
    AsyncNotifyingDatasetCoreFactory<Quad, Quad, AsyncDefaultNotifyingDatasetCore>

/**
 * Asynchronous counterpart of
 * {@link "../DatasetWrapper.js"!DatasetWrapper}.
 *
 * Behaviourally identical to its synchronous sibling - it presents an
 * underlying RDF/JS dataset as a default-graph-only view and offers the
 * same `subjectsOf` / `objectsOf` / `instancesOf` / `match*` helpers -
 * but every operation that touches storage is awaited and iteration is
 * exposed via {@link Symbol.asyncIterator}.
 *
 * The constructor accepts either a fully async
 * {@link AsyncNotifyingDatasetCore} or any synchronous
 * {@link DatasetCore}; in the latter case the dataset is automatically
 * wrapped in an
 * {@link "./AsyncNotifyingDatasetCoreWrapper.js"!AsyncNotifyingDatasetCoreWrapper}
 * so existing sync stores (e.g. an n3 `Store`) can be used unchanged.
 *
 * @example Subclassing for queries
 * ```ts
 * class People extends AsyncDatasetWrapper {
 *   get all(): AsyncIterable<AsyncPerson> {
 *     return this.subjectsOf("https://example.org/name", AsyncPerson)
 *   }
 * }
 *
 * const people = new People(asyncDataset, factory, asyncDatasetFactory)
 * for await (const person of people.all) {
 *   console.log(await person.name)
 * }
 * console.log(await people.size)
 * ```
 *
 * @example Subscribing to changes
 * ```ts
 * people.on(async (event, quad) => {
 *   await audit.record(event, quad)
 * })
 * ```
 */
export class AsyncDatasetWrapper implements AsyncDefaultNotifyingDatasetCore {
    private readonly dataset: AsyncNotifyingDatasetCore<Triple, Triple>
    protected readonly datasetFactory: AsyncDefaultDatasetCoreFactory

    public constructor(
        dataset: AsyncNotifyingDatasetCore<Triple, Triple> | DatasetCore<Triple, Triple>,
        protected readonly factory: DataFactory<Triple, Triple>,
        datasetFactory: AsyncDefaultDatasetCoreFactory,
    ) {
        this.dataset = ensureAsyncNotifyingDatasetCore<Triple, Triple>(dataset)
        this.datasetFactory = datasetFactory
    }

    //#region AsyncDatasetCore

    get size(): Promise<number> {
        return this.match(undefined, undefined, undefined, defaultGraph).size
    }

    [Symbol.asyncIterator](): AsyncIterator<Triple> {
        return this.match(undefined, undefined, undefined, defaultGraph)[Symbol.asyncIterator]()
    }

    async add(quad: Triple): Promise<this> {
        ensureDefaultGraph(quad)
        await this.dataset.add(quad)
        return this
    }

    async delete(quad: Triple): Promise<this> {
        ensureDefaultGraph(quad)
        await this.dataset.delete(quad)
        return this
    }

    async has(quad: Triple): Promise<boolean> {
        ensureDefaultGraph(quad)
        return this.dataset.has(quad)
    }

    match(
        subject: Triple["subject"] | undefined,
        predicate: Triple["predicate"] | undefined,
        object: Triple["object"] | undefined,
        graph: DefaultGraph,
    ): AsyncDefaultNotifyingDatasetCore {
        ensureTermType(graph, "DefaultGraph")
        return this.dataset.match(subject, predicate, object, defaultGraph) as AsyncDefaultNotifyingDatasetCore
    }

    //#endregion

    //#region Notifications

    on(listener: AsyncListener<Triple>): void {
        this.dataset.on(listener)
    }

    off(listener: AsyncListener<Triple>): void {
        this.dataset.off(listener)
    }

    //#endregion

    //#region Utilities

    protected subjectsOf<T>(predicate: string, termWrapper: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchSubjectsOf(termWrapper, this.factory.namedNode(predicate))
    }

    protected objectsOf<T>(predicate: string, termWrapper: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchObjectsOf(termWrapper, undefined, this.factory.namedNode(predicate))
    }

    protected instancesOf<T>(klass: string, constructor: IAsyncTermWrapperConstructor<T>): AsyncIterable<T> {
        return this.matchSubjectsOf(constructor, this.factory.namedNode(RDF.type), this.factory.namedNode(klass))
    }

    protected async *matchSubjectsOf<T>(
        termWrapper: IAsyncTermWrapperConstructor<T>,
        predicate?: Triple["predicate"],
        object?: Triple["object"],
    ): AsyncIterable<T> {
        for await (const q of this.match(undefined, predicate, object, defaultGraph)) {
            yield new termWrapper(q.subject, this, this.factory)
        }
    }

    protected async *matchObjectsOf<T>(
        termWrapper: IAsyncTermWrapperConstructor<T>,
        subject?: Triple["subject"],
        predicate?: Triple["predicate"],
    ): AsyncIterable<T> {
        for await (const q of this.match(subject, predicate, undefined, defaultGraph)) {
            yield new termWrapper(q.object, this, this.factory)
        }
    }

    //#endregion

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }
}
