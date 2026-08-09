import type { AsyncDatasetCore } from "@jeswr/async-dataset"
import type { Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { AsyncTermWrapper } from "./AsyncTermWrapper.js"
import type { IAsyncTermAsValueMapping } from "./type/IAsyncTermAsValueMapping.js"
import type { IAsyncTermFromValueMapping } from "./type/IAsyncTermFromValueMapping.js"

/**
 * The asynchronous counterpart of the set returned by {@link SetFrom.subjectPredicate}: a live, mutable view over the objects of all statements with a given subject and predicate in an {@link AsyncDatasetCore | asynchronous dataset}.
 *
 * @remarks
 * This class cannot implement {@link Set}, because the standard interface is synchronous. It offers the same member shape instead, with {@link Promise}-returning methods and asynchronous iteration.
 *
 * The set is live: iteration, {@link size} and {@link has} re-query the dataset on every call, so the contents always reflect the dataset's current state, and mutations performed via {@link add}, {@link delete} and {@link clear} write through to the dataset.
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
