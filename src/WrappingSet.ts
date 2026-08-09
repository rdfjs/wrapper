import type { EventfulDatasetCore } from "@jeswr/eventful-dataset"
import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { DatasetCore, Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { DatasetEventsError } from "./errors/DatasetEventsError.js"
import { TermWrapper } from "./TermWrapper.js"

/**
 * Listener invoked when a value is added to or removed from a {@link WrappingSet}.
 *
 * The kind of mutation (`"add"` or `"delete"`) is supplied alongside the JavaScript value that the object of the affected quad maps to.
 *
 * @template T - The type of value contained in the observed {@link WrappingSet}.
 * @param event - `"add"` when a matching quad was added to the underlying dataset, `"delete"` when one was removed.
 * @param value - The object of the affected quad, converted by the {@link ITermAsValueMapping | mapping} the set was created with.
 *
 * @see
 * - {@link WrappingSet.on}
 * - {@link WrappingSet.off}
 */
export type WrappingSetListener<T> = (event: "add" | "delete", value: T) => void

/**
 * The dataset surface required for change subscriptions: a {@link DatasetCore} that is also a Node.js [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter) emitting `"add"` and `"delete"` events carrying the affected quad, as implemented by `EventfulDatasetCore` from the [@jeswr/eventful-dataset](https://github.com/jeswr/eventful-dataset) package.
 */
type EventfulDatasetLike = DatasetCore & Pick<EventfulDatasetCore, "on" | "off">

/**
 * The pair of dataset-level event handlers created by a single {@link WrappingSet.on} call, remembered together with the dataset they were attached to so {@link WrappingSet.off} can detach them later.
 */
type ListenerAdapter = {
    dataset: EventfulDatasetLike
    add: (quad: Quad) => void
    delete: (quad: Quad) => void
}

/**
 * Registry of dataset-level adapters created by {@link WrappingSet.on}, keyed by the user listener so {@link WrappingSet.off} can detach the correct adapter even when called on a different {@link WrappingSet} instance that targets the same subject and predicate. That is the common case, because mappers like {@link SetFrom.subjectPredicate} construct a fresh {@link WrappingSet} on each property access.
 *
 * The inner key is `<subject value>\u0000<predicate IRI>`. The literal NUL byte is used as a separator because it cannot appear in an IRI, so the key is unambiguous.
 */
const listenerAdapters = new WeakMap<WrappingSetListener<any>, Map<string, ListenerAdapter>>()

export class WrappingSet<T> implements Set<T> {
    // TODO: Direction
    public constructor(private readonly subject: TermWrapper, private readonly predicate: string, private readonly termAs: ITermAsValueMapping<T>, private readonly termFrom: ITermFromValueMapping<T>) {
    }

    add(value: T): this {
        this.subject.dataset.add(this.quad(value))
        return this
    }

    clear(): void {
        for (const q of this.matches) {
            this.subject.dataset.delete(q)
        }
    }

    delete(value: T): boolean {
        if (!this.has(value)) {
            return false
        }

        const o = this.termFrom(value, this.subject.factory) // TODO: guards
        const p = this.subject.factory.namedNode(this.predicate)

        for (const q of this.subject.dataset.match(this.subject as Term, p, o as Term)) {
            this.subject.dataset.delete(q)
        }

        return true
    }

    forEach(cb: (item: T, index: T, set: Set<T>) => void, thisArg?: any): void {
        for (const item of this) {
            cb.call(thisArg, item, item, this)
        }
    }

    has(value: T): boolean {
        return this.subject.dataset.has(this.quad(value))
    }

    get size(): number {
        return this.matches.size
    }

    [Symbol.iterator](): SetIterator<T> {
        return this.values()
    }

    * entries(): SetIterator<[T, T]> {
        for (const v of this) {
            yield [v, v]
        }
    }

    keys(): SetIterator<T> {
        return this.values()
    }

    * values(): SetIterator<T> {
        for (const q of this.matches) {
            yield this.termAs(new TermWrapper(q.object, this.subject.dataset, this.subject.factory))
        }
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    private quad(value: T): Quad {
        const s = this.subject as Quad_Subject // TODO: guard
        const p = this.subject.factory.namedNode(this.predicate)
        const o = this.termFrom(value, this.subject.factory) as Quad_Object // TODO: guards
        const q = this.subject.factory.quad(s, p, o)
        return q
    }

    private get matches(): DatasetCore {
        const p = this.subject.factory.namedNode(this.predicate)
        return this.subject.dataset.match(this.subject as Term, p)
    }

    //#region Events

    /**
     * Subscribes `listener` to additions and removals on this set.
     *
     * @remarks
     * Internally this filters the underlying dataset's change events for quads whose subject and predicate match this set, converts their objects to JavaScript values via the {@link ITermAsValueMapping | mapping} the set was created with, and forwards the result to `listener`. Mutations performed through any other route (the dataset itself, sibling wrappers, etc.) are therefore also observed, provided they affect this set's subject and predicate.
     *
     * Change events are only available when the underlying dataset emits them, i.e. when it is also a Node.js [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter) emitting `"add"` and `"delete"` events carrying the affected quad, such as `EventfulDatasetCore` from the [@jeswr/eventful-dataset](https://github.com/jeswr/eventful-dataset) package.
     *
     * The same `listener` may be passed to {@link off} on any {@link WrappingSet} that targets the same subject and predicate, not just this instance. Subscribing the same `listener` again for the same subject and predicate replaces the previous subscription, so events are never delivered to a listener twice.
     *
     * @example Observing a set-valued property
     * Assume the following RDF data:
     * ```turtle
     * BASE <http://example.com/>
     *
     * <someSubject> <someProperty> "some value" .
     * ```
     *
     * A model exposes the objects of `someProperty` as a set of strings:
     * ```ts
     * class SomeClass extends TermWrapper {
     *   get someProperty(): WrappingSet<string> {
     *     return SetFrom.subjectPredicate(this, "http://example.com/someProperty", LiteralAs.string, LiteralFrom.string)
     *   }
     * }
     *
     * // eventfulDataset emits "add" and "delete" quad events, e.g. an EventfulDatasetCore
     * const instance = new SomeClass("http://example.com/someSubject", eventfulDataset, DataFactory)
     *
     * instance.someProperty.on((event, value) => console.log(event, value))
     *
     * instance.someProperty.add("some other value") // logs: add some other value
     * instance.someProperty.delete("some value")    // logs: delete some value
     * ```
     *
     * @example Listener identity across instances
     * Mappers like {@link SetFrom.subjectPredicate} return a fresh {@link WrappingSet} on every property access. {@link off} is keyed by listener, subject and predicate rather than by instance, so the following works:
     * ```ts
     * instance.someProperty.on(listener)
     * instance.someProperty.off(listener) // detaches the listener attached above
     * ```
     *
     * @param listener - Invoked with the kind of mutation and the mapped value whenever a quad matching this set's subject and predicate is added to or removed from the underlying dataset.
     * @throws A {@link DatasetEventsError} when the underlying dataset does not emit change events.
     *
     * @see
     * - {@link WrappingSetListener}
     * - {@link off}
     * - [RDF/JS: Dataset specification](https://rdf.js.org/dataset-spec/)
     */
    public on(listener: WrappingSetListener<T>): void {
        const dataset = this.eventfulDataset
        const subject = this.subject as Term
        const predicate = this.subject.factory.namedNode(this.predicate)
        const source = this.subject.dataset
        const factory = this.subject.factory
        const termAs = this.termAs

        const project = (event: "add" | "delete") => (quad: Quad): void => {
            if (!subject.equals(quad.subject) || !predicate.equals(quad.predicate)) {
                return
            }

            listener(event, termAs(new TermWrapper(quad.object, source, factory)))
        }

        const adapter: ListenerAdapter = { dataset, add: project("add"), delete: project("delete") }

        let adapters = listenerAdapters.get(listener)
        if (adapters === undefined) {
            adapters = new Map()
            listenerAdapters.set(listener, adapters)
        }

        // If the same listener is already attached for this (subject, predicate)
        // pair - possibly via a sibling instance - detach the old adapter first
        // so dataset events are never delivered to the listener twice.
        const existing = adapters.get(this.adapterKey)
        if (existing !== undefined) {
            existing.dataset.off("add", existing.add)
            existing.dataset.off("delete", existing.delete)
        }

        adapters.set(this.adapterKey, adapter)
        dataset.on("add", adapter.add)
        dataset.on("delete", adapter.delete)
    }

    /**
     * Detaches a listener previously attached with {@link on}.
     *
     * @remarks
     * The same function reference must be supplied; unknown listeners are ignored. It is safe to call this on a different {@link WrappingSet} instance than the one used for {@link on}, as long as both target the same subject and predicate.
     *
     * @param listener - The listener to detach.
     *
     * @see
     * - {@link WrappingSetListener}
     * - {@link on}
     */
    public off(listener: WrappingSetListener<T>): void {
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

        adapter.dataset.off("add", adapter.add)
        adapter.dataset.off("delete", adapter.delete)
    }

    /**
     * The underlying dataset, verified to emit change events.
     *
     * @throws A {@link DatasetEventsError} when the underlying dataset does not emit change events.
     */
    private get eventfulDataset(): EventfulDatasetLike {
        const dataset = this.subject.dataset as Partial<EventfulDatasetLike> & DatasetCore

        if (typeof dataset.on !== "function" || typeof dataset.off !== "function") {
            throw new DatasetEventsError(this.subject.dataset)
        }

        return dataset as EventfulDatasetLike
    }

    /**
     * Stable identity for this set's (subject, predicate) pair, used as the inner key into the listener registry. The NUL separator cannot appear in an IRI, so the key is unambiguous.
     */
    private get adapterKey(): string {
        return `${this.subject.value}\u0000${this.predicate}`
    }

    //#endregion
}
