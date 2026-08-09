import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { DatasetCore, NamedNode, Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { TermWrapper } from "./TermWrapper.js"

/**
 * A {@link Set} view over the objects of all `<subject> <predicate> ?o`
 * quads in the underlying dataset.
 *
 * @remarks
 * The set is **live**: iteration, {@link size} and {@link has} re-query the
 * dataset on every call, so the contents always reflect the current state.
 * Mutations performed via {@link add}, {@link delete} and {@link clear}
 * write through to the underlying dataset.
 *
 * Application code typically obtains instances through
 * {@link SetFrom.subjectPredicate}, which constructs a fresh
 * {@link WrappingSet} on every property access.
 *
 * @example Exposing a set-valued property on a model
 * Assume the following RDF data:
 * ```turtle
 * BASE <http://example.com/>
 *
 * <someSubject> <someProperty> "some value", "some other value" .
 * ```
 *
 * A model can expose the objects of `someProperty` as a mutable set of strings:
 * ```ts
 * class SomeClass extends TermWrapper {
 *   get someProperty(): WrappingSet<string> {
 *     return SetFrom.subjectPredicate(this, "http://example.com/someProperty", LiteralAs.string, LiteralFrom.string)
 *   }
 * }
 *
 * const instance = new SomeClass("http://example.com/someSubject", dataset, DataFactory)
 *
 * instance.someProperty.size                 // 2
 * instance.someProperty.add("a third value") // the underlying dataset now contains a third statement
 * ```
 *
 * @see
 * - {@link SetFrom.subjectPredicate}
 */
export class WrappingSet<T> implements Set<T> {
    // TODO: Direction

    /**
     * Constructs a {@link WrappingSet}.
     *
     * Application code typically does not call this constructor directly;
     * use {@link SetFrom.subjectPredicate} instead, which produces a
     * {@link WrappingSet} for a given anchor / predicate / mapping triple.
     *
     * @param subject  The anchor {@link TermWrapper} - all quads in this
     *                 set have this term as their subject.
     * @param predicate The IRI of the predicate - all quads in this set
     *                  have a {@link NamedNode} with this IRI as their
     *                  predicate.
     * @param termAs   Mapping from RDF object to JavaScript value, used by
     *                 iteration.
     * @param termFrom Mapping from JavaScript value to RDF object, used by
     *                 {@link add}, {@link delete} and {@link has}.
     */
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
}
