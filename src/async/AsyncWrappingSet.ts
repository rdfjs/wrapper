import type { AsyncDatasetCore, Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { DatasetEventsError } from "../errors/DatasetEventsError.js"
import { AsyncTermWrapper } from "./AsyncTermWrapper.js"
import type { AsyncDatasetWrapper } from "./AsyncDatasetWrapper.js"
import type { IAsyncDatasetChangeListener } from "./type/IAsyncDatasetChangeListener.js"
import type { IAsyncTermAsValueMapping } from "./type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermFromValueMapping } from "./type/IAsyncTermFromValueMapping.js"

/**
 * Listener invoked when a value is added to or removed from an {@link AsyncWrappingSet}.
 *
 * The kind of mutation (`"add"` or `"delete"`) is supplied alongside the JavaScript value that the object of the affected quad maps to.
 *
 * @remarks
 * Listeners may be asynchronous: a returned {@link Promise} is awaited before other listeners of the underlying dataset are invoked, and the promise returned by the mutation that triggered the notification only resolves once every listener has settled.
 *
 * @template T - The type of value contained in the observed {@link AsyncWrappingSet}.
 * @param event - `"add"` when a matching quad was added to the underlying dataset, `"delete"` when one was removed.
 * @param value - The object of the affected quad, converted by the {@link IAsyncTermAsValueMapping | mapping} the set was created with.
 *
 * @see
 * - {@link AsyncWrappingSet.on}
 * - {@link AsyncWrappingSet.off}
 */
export type AsyncWrappingSetListener<T> = (event: "add" | "delete", value: T) => void | Promise<void>

/**
 * The dataset surface required for change subscriptions: an {@link AsyncDatasetCore} that also notifies subscribers of `"add"` and `"delete"` changes carrying the affected quad, as implemented by {@link AsyncDatasetWrapper}.
 */
type AsyncNotifyingDatasetCore = AsyncDatasetCore & Pick<AsyncDatasetWrapper, "on" | "off">

/**
 * The dataset-level event handler created by a single {@link AsyncWrappingSet.on} call, remembered together with the dataset it was attached to so {@link AsyncWrappingSet.off} can detach it later.
 */
type ListenerAdapter = {
    dataset: AsyncNotifyingDatasetCore
    handler: IAsyncDatasetChangeListener
}

/**
 * Registry of dataset-level adapters created by {@link AsyncWrappingSet.on}, keyed by the user listener so {@link AsyncWrappingSet.off} can detach the correct adapter even when called on a different {@link AsyncWrappingSet} instance that targets the same subject and predicate. That is the common case, because mappers like {@link AsyncSetFrom.subjectPredicate} construct a fresh {@link AsyncWrappingSet} on each property access.
 *
 * The inner key is `<subject value>\u0000<predicate IRI>`. The literal NUL byte is used as a separator because it cannot appear in an IRI, so the key is unambiguous.
 */
const listenerAdapters = new WeakMap<AsyncWrappingSetListener<any>, Map<string, ListenerAdapter>>()

/**
 * The asynchronous counterpart of the set returned by {@link SetFrom.subjectPredicate}: a live, mutable view over the objects of all statements with a given subject and predicate in an {@link AsyncDatasetCore | asynchronous dataset}.
 *
 * @remarks
 * This class cannot implement {@link Set}, because the standard interface is synchronous. It offers the same member shape instead, with {@link Promise}-returning methods and asynchronous iteration.
 *
 * The set is live: iteration, {@link size} and {@link has} re-query the dataset on every call, so the contents always reflect the dataset's current state, and mutations performed via {@link add}, {@link delete} and {@link clear} write through to the dataset.
 *
 * Changes to the contents of the set can be observed with {@link on} and {@link off} when the underlying dataset emits change notifications, as the dataset surface of {@link AsyncDatasetWrapper} does.
 *
 * @example Iterating
 * ```ts
 * for await (const child of parent.children) {
 *   console.log(await child.name)
 * }
 *
 * console.log(await parent.children.size)
 * ```
 *
 * @example Mutating
 * ```ts
 * await parent.children.add(child)
 * await parent.children.delete(child)
 * ```
 *
 * @example Subscribing to changes
 * Listeners receive the change type (`"add"` or `"delete"`) and the mapped JavaScript value for this set's subject and predicate, so callers do not need to filter dataset-wide events themselves. Listeners may be asynchronous; a returned promise is awaited before the next listener of the underlying dataset is invoked:
 * ```ts
 * parent.children.on(async (event, child) => {
 *   console.log(event, await child.name)
 * })
 *
 * await parent.children.add(bob)    // logs: add, "Bob"
 * await parent.children.delete(bob) // logs: delete, "Bob"
 * ```
 *
 * @see
 * - {@link AsyncSetFrom.subjectPredicate}
 */
export class AsyncWrappingSet<T> implements AsyncIterable<T> {
    public constructor(private readonly subject: AsyncTermWrapper, private readonly predicate: string, private readonly termAs: IAsyncTermAsValueMapping<T>, private readonly termFrom: IAsyncTermFromValueMapping<T>) {
    }

    /**
     * Adds a statement with this set's subject and predicate and the term the given value maps to as object.
     *
     * @param value - The value to add to the set.
     * @returns A promise of this set.
     */
    public async add(value: T): Promise<this> {
        await this.subject.dataset.add(this.quad(value))

        return this
    }

    /**
     * Deletes all statements with this set's subject and predicate.
     *
     * @returns A promise that resolves once the underlying dataset has been updated.
     */
    public async clear(): Promise<void> {
        for (const q of await this.materialize()) {
            await this.subject.dataset.delete(q)
        }
    }

    /**
     * Deletes the statements with this set's subject and predicate and the term the given value maps to as object.
     *
     * @param value - The value to delete from the set.
     * @returns A promise of whether the value was in the set before deletion.
     */
    public async delete(value: T): Promise<boolean> {
        if (!(await this.has(value))) {
            return false
        }

        const o = this.termFrom(value, this.subject.factory)
        const p = this.subject.factory.namedNode(this.predicate)

        const existing: Quad[] = []
        for await (const q of this.subject.dataset.match(this.subject as Term, p, o as Term)) {
            existing.push(q)
        }

        for (const q of existing) {
            await this.subject.dataset.delete(q)
        }

        return true
    }

    /**
     * Invokes a callback for each value in the set.
     *
     * @param cb - The callback to invoke. A returned promise is awaited before the next invocation.
     * @param thisArg - The value to use as `this` when invoking the callback.
     * @returns A promise that resolves once all values have been visited.
     */
    public async forEach(cb: (item: T, index: T, set: AsyncWrappingSet<T>) => void | Promise<void>, thisArg?: any): Promise<void> {
        for await (const item of this) {
            await cb.call(thisArg, item, item, this)
        }
    }

    /**
     * Determines whether the dataset contains a statement with this set's subject and predicate and the term the given value maps to as object.
     *
     * @param value - The value to look for in the set.
     * @returns A promise of whether the value is in the set.
     */
    public async has(value: T): Promise<boolean> {
        return this.subject.dataset.has(this.quad(value))
    }

    /**
     * A promise of the number of statements with this set's subject and predicate.
     */
    public get size(): Promise<number> {
        return this.matches.size
    }

    public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
        return this.values()
    }

    /**
     * Iterates the values of the set as `[value, value]` entries, mirroring {@link Set.entries}.
     */
    public async * entries(): AsyncIterableIterator<[T, T]> {
        for await (const v of this) {
            yield [v, v]
        }
    }

    /**
     * Iterates the values of the set, mirroring {@link Set.keys}.
     */
    public keys(): AsyncIterableIterator<T> {
        return this.values()
    }

    /**
     * Iterates the values the objects of statements with this set's subject and predicate map to.
     */
    public async * values(): AsyncIterableIterator<T> {
        for await (const q of this.matches) {
            yield await this.termAs(new AsyncTermWrapper(q.object, this.subject.dataset, this.subject.factory))
        }
    }

    /**
     * The well-known property containing a string that represents the type of this object.
     */
    public get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    //#region Events

    /**
     * Subscribes `listener` to additions and removals on this set.
     *
     * The listener is invoked once per matching change to the underlying dataset - whether performed through this set, through a sibling wrapper, or directly on the dataset - and receives the kind of the mutation alongside the value the affected quad's object {@link IAsyncTermAsValueMapping | maps} to.
     *
     * @remarks
     * - Requires the underlying dataset to notify subscribers of `"add"` and `"delete"` changes, as the dataset surface of {@link AsyncDatasetWrapper} does.
     * - Only effective changes are notified: adding a value that is already in the set, or deleting one that is not, does not invoke the listener.
     * - Subscriptions are keyed by listener, subject and predicate rather than by set instance, so the fresh {@link AsyncWrappingSet} returned by every property access is interchangeable with the one {@link on} was called on. Attaching the same listener again for the same subject and predicate replaces the previous subscription, so notifications are never delivered twice.
     *
     * @param listener - The callback to invoke with every change to the contents of the set.
     *
     * @throws {@link DatasetEventsError} If the underlying dataset does not emit change events.
     *
     * @see
     * - {@link off} for detaching the listener.
     * - {@link AsyncWrappingSetListener} for the listener signature.
     * - {@link AsyncDatasetWrapper.on} for quad-level notifications on the whole dataset.
     */
    public on(listener: AsyncWrappingSetListener<T>): void {
        const dataset = this.notifyingDataset
        const subject = this.subject as Term
        const predicate = this.subject.factory.namedNode(this.predicate)
        const termAs = this.termAs
        const factory = this.subject.factory

        const handler: IAsyncDatasetChangeListener = async (event, quad) => {
            if (!quad.subject.equals(subject) || !quad.predicate.equals(predicate)) {
                return
            }

            await listener(event, await termAs(new AsyncTermWrapper(quad.object, dataset, factory)))
        }

        let adapters = listenerAdapters.get(listener)

        if (adapters === undefined) {
            adapters = new Map()
            listenerAdapters.set(listener, adapters)
        }

        const existing = adapters.get(this.adapterKey)

        if (existing !== undefined) {
            existing.dataset.off(existing.handler)
        }

        adapters.set(this.adapterKey, { dataset, handler })
        dataset.on(handler)
    }

    /**
     * Unsubscribes `listener` from change notifications for this set's subject and predicate.
     *
     * @remarks
     * The argument must be the same function reference that was passed to {@link on}, but not necessarily on the same {@link AsyncWrappingSet} instance: subscriptions are keyed by listener, subject and predicate. Detaching a listener that is not subscribed for this set's subject and predicate has no effect.
     *
     * @param listener - The callback to detach.
     *
     * @see
     * - {@link on} for attaching a listener.
     */
    public off(listener: AsyncWrappingSetListener<T>): void {
        const adapters = listenerAdapters.get(listener)

        if (adapters === undefined) {
            return
        }

        const adapter = adapters.get(this.adapterKey)

        if (adapter === undefined) {
            return
        }

        adapters.delete(this.adapterKey)

        if (adapters.size === 0) {
            listenerAdapters.delete(listener)
        }

        adapter.dataset.off(adapter.handler)
    }

    /**
     * The underlying dataset, if it notifies subscribers of changes.
     *
     * @throws {@link DatasetEventsError} If the underlying dataset does not emit change events.
     */
    private get notifyingDataset(): AsyncNotifyingDatasetCore {
        const dataset = this.subject.dataset

        if (typeof (dataset as Partial<AsyncNotifyingDatasetCore>).on !== "function" || typeof (dataset as Partial<AsyncNotifyingDatasetCore>).off !== "function") {
            throw new DatasetEventsError(dataset)
        }

        return dataset as AsyncNotifyingDatasetCore
    }

    /**
     * The key of this set's subject and predicate in the adapter registry.
     */
    private get adapterKey(): string {
        return `${this.subject.value}\u0000${this.predicate}`
    }

    //#endregion

    private quad(value: T): Quad {
        const s = this.subject as Quad_Subject
        const p = this.subject.factory.namedNode(this.predicate)
        const o = this.termFrom(value, this.subject.factory) as Quad_Object
        const q = this.subject.factory.quad(s, p, o)

        return q
    }

    private get matches(): AsyncDatasetCore {
        const p = this.subject.factory.namedNode(this.predicate)

        return this.subject.dataset.match(this.subject as Term, p)
    }

    private async materialize(): Promise<Quad[]> {
        const quads: Quad[] = []

        for await (const q of this.matches) {
            quads.push(q)
        }

        return quads
    }
}
