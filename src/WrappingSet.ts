import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { DatasetCore, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { Triple } from "./type/ITriple.js"
import type { ChangeEvent } from "./dataset/NotifyingDatasetCore.js"
import { TermWrapper } from "./TermWrapper.js"

/**
 * Listener invoked when a value is added to or removed from a
 * {@link WrappingSet}. The mutation type (`'add'` or `'delete'`) is
 * supplied alongside the mapped JavaScript value.
 */
export type WrappingSetListener<T> = (event: ChangeEvent, value: T) => void

/**
 * Registry of dataset-level adapters created by {@link WrappingSet.on},
 * keyed by the user listener so {@link WrappingSet.off} can detach the
 * correct adapter even when called on a different {@link WrappingSet}
 * instance that targets the same subject and predicate (which is the
 * common case, because mappers like {@link SetFrom} construct a fresh
 * {@link WrappingSet} on each property access).
 *
 * Inner key: `<subject IRI>\u0000<predicate IRI>`. The literal NUL byte
 * is used as a separator because it cannot appear in IRIs.
 */
const listenerAdapters = new WeakMap<
    WrappingSetListener<any>,
    Map<string, (event: ChangeEvent, q: Triple) => void>
>()

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

        for (const q of this.subject.dataset.match(this.subject as Quad_Subject, p, o as Quad_Object, this.subject.factory.defaultGraph())) {
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

    private quad(value: T): Triple {
        const s = this.subject as Quad_Subject // TODO: guard
        const p = this.subject.factory.namedNode(this.predicate)
        const o = this.termFrom(value, this.subject.factory) as Quad_Object // TODO: guards
        const q = this.subject.factory.quad(s, p, o)
        return q
    }

    private get matches(): DatasetCore<Triple, Triple> {
        const p = this.subject.factory.namedNode(this.predicate)
        return this.subject.dataset.match(this.subject as Quad_Subject, p, undefined, this.subject.factory.defaultGraph())
    }

    /**
     * Subscribes `listener` to additions and removals on this set.
     *
     * Internally this filters the underlying dataset's change stream for
     * quads whose subject and predicate match this set, projects them to
     * the mapped JavaScript value via the configured `termAs` mapping, and
     * forwards the result to `listener`. Mutations performed through any
     * other route (direct {@link DatasetWrapper.add} / {@link DatasetWrapper.delete}
     * calls, sibling wrappers, etc.) are still observed, provided they
     * affect this set's subject/predicate slot.
     *
     * The same `listener` may safely be passed to {@link off} on any
     * {@link WrappingSet} that targets the same subject and predicate.
     * This is important because mappers such as {@link SetFrom} typically
     * produce a fresh {@link WrappingSet} on every property access.
     */
    public on(listener: WrappingSetListener<T>): void {
        const subject = this.subject as Quad_Subject
        const predicate = this.subject.factory.namedNode(this.predicate)
        const dataset = this.subject.dataset
        const factory = this.subject.factory
        const termAs = this.termAs
        const key = this.adapterKey

        const adapter = (event: ChangeEvent, q: Triple): void => {
            if (!q.subject.equals(subject) || !q.predicate.equals(predicate)) {
                return
            }
            if (q.graph.termType !== "DefaultGraph") {
                return
            }
            listener(event, termAs(new TermWrapper(q.object, dataset, factory)))
        }

        let perKey = listenerAdapters.get(listener)
        if (perKey === undefined) {
            perKey = new Map()
            listenerAdapters.set(listener, perKey)
        }

        // If the same listener was already attached to a sibling
        // WrappingSet for this same (subject, predicate), detach the old
        // adapter first so we don't accumulate duplicate dataset listeners.
        const existing = perKey.get(key)
        if (existing !== undefined) {
            dataset.off(existing)
        }

        perKey.set(key, adapter)
        dataset.on(adapter)
    }

    /**
     * Detaches a listener previously attached with {@link on}. The same
     * function reference must be supplied; unknown listeners are ignored.
     * It is safe to call this on a different {@link WrappingSet} instance
     * than the one used for {@link on}, as long as both target the same
     * subject and predicate.
     */
    public off(listener: WrappingSetListener<T>): void {
        const perKey = listenerAdapters.get(listener)
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
            listenerAdapters.delete(listener)
        }
        this.subject.dataset.off(adapter)
    }

    /**
     * Stable identity for this set's (subject, predicate) pair, used as
     * the inner key into {@link listenerAdapters}. The NUL separator
     * cannot appear in an IRI, so the key is unambiguous.
     */
    private get adapterKey(): string {
        return `${(this.subject as Term).value}\u0000${this.predicate}`
    }
}
