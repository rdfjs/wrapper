import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import { WrappingSet } from "./WrappingSet.js"
import { WrappingMap } from "./WrappingMap.js"
import { AnyTermWithContext } from "./AnyTermWithContext.js"

export class TermWrapper extends AnyTermWithContext {
    get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    toJSON() {
        const result = {}

        for (let instance = this; instance !== null; instance = Object.getPrototypeOf(instance)) {
            for (const [propertyName, {value: propertyValue}] of Object.entries(Object.getOwnPropertyDescriptors(instance))) {
                if (propertyValue !== undefined) {
                    continue
                }

                Reflect.set(result, propertyName, Reflect.get(this, propertyName))
            }
        }

        return result
    }

    protected singular<T>(p: string, termAs: ITermAsValueMapping<T>): T {
        const predicate = this.factory.namedNode(p)
        const matches = this.dataset.match(this as Term, predicate)[Symbol.iterator]()

        // TODO: Expose standard errors
        const {value: first, done: none} = matches.next()

        if (none) {
            throw new Error(`No value found for predicate ${p} on term ${this.value}`)
        }

        if (!matches.next().done) {
            throw new Error(`More than one value for predicate ${p} on term ${this.value}`)
        }

        return termAs(new TermWrapper(first.object, this.dataset, this.factory))
    }

    protected singularNullable<T>(p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        const predicate = this.factory.namedNode(p)

        for (const q of this.dataset.match(this as Term, predicate)) {
            return termAs(new TermWrapper(q.object, this.dataset, this.factory))
        }

        return
    }

    protected overwrite<T>(p: string, value: T, termFrom: ITermFromValueMapping<T>): void {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        this.overwriteNullable(p, value, termFrom)
    }

    protected overwriteNullable<T>(p: string, value: T | undefined, termFrom: ITermFromValueMapping<T>): void {
        const predicate = this.factory.namedNode(p)

        for (const q of this.dataset.match(this as Term, predicate)) {
            this.dataset.delete(q)
        }

        // TODO: TermMapping undefined: Return after deleting quads if undefined
        if (value === undefined) {
            return
        }

        // TODO: Do we really need to test if this is a Quad Subject here?
        // @Samu I imagine this is tested at instantiation time in the constructor if at all
        if (!TermWrapper.isQuadSubject(this as Term)) {
            return // TODO: throw error?
        }

        // TODO: TermMapping undefined: the term mapping is not invoked if undefined
        const o = termFrom(value, this.factory)

        if (o === undefined) {
            return // TODO: throw error?
        }

        if (!TermWrapper.isQuadObject(o as Term)) {
            return // TODO: throw error?
        }

        const q = this.factory.quad(this as Quad_Subject, predicate, o as Quad_Object)
        this.dataset.add(q)
    }

    protected objects<T>(p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
        return new WrappingSet(this, p, termAs, termFrom)
    }

    protected map<TKey, TValue>(p: string, termAs: ITermAsValueMapping<[TKey, TValue]>, termFrom: ITermFromValueMapping<[TKey, TValue]>): Map<TKey, TValue> {
        return new WrappingMap(this, p, termAs, termFrom)
    }

    private static isQuadSubject(term: Term): term is Quad_Subject {
        return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
    }

    private static isQuadObject(term: Term): term is Quad_Object {
        return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
    }
}
