import { TermWrapper } from "./TermWrapper.js"
import type { TermNode } from "./TermWrapper.js"
import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"

export class WrappingMap<TKey, TValue> implements Map<TKey, TValue> {
    constructor(private readonly subject: TermNode, private readonly predicate: string, private readonly termAs: ITermAsValueMapping<[TKey, TValue]>, private readonly termFrom: ITermFromValueMapping<[TKey, TValue]>) {
    }

    clear(): void {
        for (const q of this.matches) {
            this.subject.dataset.delete(q)
        }
    }

    delete(k: TKey): boolean {
        const p = this.subject.factory.namedNode(this.predicate)

        for (const entry of this) {
            if (entry[0] !== k) {
                continue
            }

            this.subject.dataset.delete(
                this.subject.factory.quad(
                    this.subject as Quad_Subject,
                    p,
                    this.termFrom(entry, this.subject.factory) as Quad_Object))

            return true
        }

        return false
    }

    forEach(callback: (value: TValue, key: TKey, map: Map<TKey, TValue>) => void, thisArg?: any): void {
        for (const [key, value] of this) {
            callback.call(thisArg, value, key, this)
        }
    }

    get(k: TKey): TValue | undefined {
        for (const [key, value] of this) {
            if (key !== k) {
                continue
            }

            return value
        }

        return undefined
    }

    has(k: TKey): boolean {
        return this.get(k) !== undefined
    }

    set(k: TKey, v: TValue): this {
        this.delete(k)
        this.add(k, v)

        return this
    }

    get size(): number {
        return [...this.matches].length
    }

    set size(_: number) {
        throw new Error("not supported")
    }

    * entries(): MapIterator<[TKey, TValue]> {
        for (const quad of this.matches) {
            yield this.termAs(TermWrapper.from(quad.object, this.subject.dataset, this.subject.factory))
        }
    }

    * keys(): MapIterator<TKey> {
        for (const [key,] of this) {
            yield key
        }
    }

    * values(): MapIterator<TValue> {
        for (const [, value] of this) {
            yield value
        }
    }

    [Symbol.iterator](): MapIterator<[TKey, TValue]> {
        return this.entries()
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    private get matches(): Iterable<Quad> {
        const p = this.subject.factory.namedNode(this.predicate)

        return this.subject.dataset.match(this.subject, p)
    }

    private add(k: TKey, v: TValue) {
        const p = this.subject.factory.namedNode(this.predicate)

        this.subject.dataset.add(
            this.subject.factory.quad(
                this.subject as Quad_Subject,
                p,
                this.termFrom([k, v], this.subject.factory) as Quad_Object))
    }
}
