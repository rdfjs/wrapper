import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { DatasetCore, Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { TermWrapper } from "./TermWrapper.js"
import type { TermNode } from "./TermWrapper.js"

export class WrappingSet<T> implements Set<T> {
    // TODO: Direction
    public constructor(private readonly subject: TermNode, private readonly predicate: string, private readonly termAs: ITermAsValueMapping<T>, private readonly termFrom: ITermFromValueMapping<T>) {
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

        for (const q of this.subject.dataset.match(this.subject, p, o as Term)) {
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
            yield this.termAs(TermWrapper.from(q.object, this.subject.dataset, this.subject.factory))
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
        return this.subject.dataset.match(this.subject, p)
    }
}
