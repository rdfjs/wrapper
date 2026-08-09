import type { DataFactory, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { Triple } from "../type/ITriple.js"
import type { ChangeEvent } from "../dataset/NotifyingDatasetCore.js"
import type { IAsyncTermAsValueMapping } from "./type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermFromValueMapping } from "./type/IAsyncTermFromValueMapping.js"
import { AsyncTermWrapper } from "./AsyncTermWrapper.js"

/**
 * Listener invoked when a value is added to or removed from an
 * {@link AsyncWrappingSet}. May be synchronous or asynchronous - the
 * dataset awaits returned promises before invoking the next listener.
 */
export type AsyncWrappingSetListener<T> =
    (event: ChangeEvent, value: T) => void | Promise<void>

const listenerAdapters = new WeakMap<
    AsyncWrappingSetListener<unknown>,
    Map<string, (event: ChangeEvent, q: Triple) => void | Promise<void>>
>()

/**
 * Asynchronous counterpart of
 * {@link "../WrappingSet.js"!WrappingSet}.
 *
 * Provides a live, mutable view over the objects of all
 * `<subject> <predicate> ?o` quads in the wrapped dataset's default
 * graph. Cannot implement {@link Set} (the standard interface is
 * synchronous) but offers the same shape with `Promise`-returning
 * methods and an asynchronous iterator.
 *
 * The set is **live**: iteration, {@link size} and {@link has} re-query
 * the dataset on every call, so the contents always reflect the
 * dataset's current state. Mutations performed via {@link add},
 * {@link delete} and {@link clear} write through to the dataset and
 * surface as change events on the underlying
 * {@link "./AsyncNotifyingDatasetCore.js"!AsyncNotifyingDatasetCore}.
 *
 * @example Iterating
 * ```ts
 * for await (const child of parent.children) {
 *   console.log(await child.name)
 * }
 * console.log(await parent.children.size)
 * ```
 *
 * @example Subscribing to changes
 * Listeners receive the change type (`'add'` or `'delete'`) and the
 * **mapped JavaScript value** for this set's subject + predicate, so
 * callers do not need to filter dataset-wide events themselves.
 * Listeners may be `async`; the dispatcher awaits a returned promise
 * before invoking the next listener:
 * ```ts
 * parent.children.on(async (event, child) => {
 *   console.log(event, await child.name)
 * })
 *
 * await parent.children.add(bob)    // logs: add, "Bob"
 * await parent.children.delete(bob) // logs: delete, "Bob"
 * ```
 *
 * @example Listener identity across instances
 * As with the sync sibling, {@link off} is keyed by
 * `(listener, subject, predicate)` rather than by instance, so the
 * fresh {@link AsyncWrappingSet} returned by every property access is
 * still a valid handle for detaching:
 * ```ts
 * parent.children.on(listener)
 * parent.children.off(listener) // detaches the listener attached above
 * ```
 */
export class AsyncWrappingSet<T> implements AsyncIterable<T> {
    public constructor(
        private readonly subject: AsyncTermWrapper,
        private readonly predicate: string,
        private readonly termAs: IAsyncTermAsValueMapping<T>,
        private readonly termFrom: IAsyncTermFromValueMapping<T>,
    ) {}

    async add(value: T): Promise<this> {
        await this.subject.dataset.add(this.quad(value))
        return this
    }

    async clear(): Promise<void> {
        const existing: Triple[] = []
        for await (const q of this.matches) {
            existing.push(q)
        }
        for (const q of existing) {
            await this.subject.dataset.delete(q)
        }
    }

    async delete(value: T): Promise<boolean> {
        if (!(await this.has(value))) {
            return false
        }

        const o = this.termFrom(value, this.subject.factory)
        const p = this.subject.factory.namedNode(this.predicate)
        const matches = this.subject.dataset.match(
            this.subject as unknown as Quad_Subject,
            p,
            o as Quad_Object,
            this.subject.factory.defaultGraph(),
        )

        const queue: Triple[] = []
        for await (const q of matches) {
            queue.push(q)
        }
        for (const q of queue) {
            await this.subject.dataset.delete(q)
        }
        return true
    }

    async has(value: T): Promise<boolean> {
        return this.subject.dataset.has(this.quad(value))
    }

    get size(): Promise<number> {
        return this.matches.size
    }

    async forEach(
        cb: (item: T, index: T, set: this) => void | Promise<void>,
        thisArg?: unknown,
    ): Promise<void> {
        for await (const item of this) {
            const r = cb.call(thisArg, item, item, this)
            if (r !== undefined) {
                await r
            }
        }
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        yield* this.values()
    }

    async *values(): AsyncIterableIterator<T> {
        for await (const q of this.matches) {
            yield await this.termAs(new AsyncTermWrapper(q.object, this.subject.dataset, this.subject.factory))
        }
    }

    async *keys(): AsyncIterableIterator<T> {
        yield* this.values()
    }

    async *entries(): AsyncIterableIterator<[T, T]> {
        for await (const v of this.values()) {
            yield [v, v]
        }
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    private quad(value: T): Triple {
        const s = this.subject as unknown as Quad_Subject
        const p = this.subject.factory.namedNode(this.predicate)
        const o = this.termFrom(value, this.subject.factory) as Quad_Object
        return this.subject.factory.quad(s, p, o)
    }

    private get matches() {
        const p = this.subject.factory.namedNode(this.predicate)
        return this.subject.dataset.match(
            this.subject as unknown as Quad_Subject,
            p,
            undefined,
            this.subject.factory.defaultGraph(),
        )
    }

    /**
     * Subscribes `listener` to additions and removals on this set. The
     * listener is invoked once per matching change event and receives the
     * mapped value via {@link IAsyncTermAsValueMapping}.
     */
    public on(listener: AsyncWrappingSetListener<T>): void {
        const subject = this.subject as unknown as Quad_Subject
        const predicate = this.subject.factory.namedNode(this.predicate)
        const dataset = this.subject.dataset
        const factory: DataFactory<Triple, Triple> = this.subject.factory
        const termAs = this.termAs
        const key = this.adapterKey

        const adapter = async (event: ChangeEvent, q: Triple): Promise<void> => {
            if (!q.subject.equals(subject as unknown as Term) || !q.predicate.equals(predicate)) {
                return
            }
            if (q.graph.termType !== "DefaultGraph") {
                return
            }
            const value = await termAs(new AsyncTermWrapper(q.object, dataset, factory))
            const r = listener(event, value)
            if (r !== undefined) {
                await r
            }
        }

        let perKey = listenerAdapters.get(listener as AsyncWrappingSetListener<unknown>)
        if (perKey === undefined) {
            perKey = new Map()
            listenerAdapters.set(listener as AsyncWrappingSetListener<unknown>, perKey)
        }

        const existing = perKey.get(key)
        if (existing !== undefined) {
            dataset.off(existing)
        }

        perKey.set(key, adapter)
        dataset.on(adapter)
    }

    public off(listener: AsyncWrappingSetListener<T>): void {
        const perKey = listenerAdapters.get(listener as AsyncWrappingSetListener<unknown>)
        if (perKey === undefined) {
            return
        }
        const key = this.adapterKey
        const adapter = perKey.get(key)
        if (adapter === undefined) {
            return
        }
        perKey.delete(key)
        if (perKey.size === 0) {
            listenerAdapters.delete(listener as AsyncWrappingSetListener<unknown>)
        }
        this.subject.dataset.off(adapter)
    }

    private get adapterKey(): string {
        return `${(this.subject as unknown as Term).value}\u0000${this.predicate}`
    }
}
