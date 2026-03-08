import { TermWrapper } from "../TermWrapper.js"
import { WrappingMap } from "../WrappingMap.js"
import { WrappingSet } from "../WrappingSet.js"
import type { IValueMapping } from "../type/IValueMapping.js"
import type { ITermMapping } from "../type/ITermMapping.js"
import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"

export namespace ArcTransformation {
    export function singular<T>(anchor: TermWrapper, p: string, _?: T, valueMapping?: IValueMapping<T>): any {
        if (valueMapping === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)
        const matches = anchor.dataset.match(anchor.term, predicate)[Symbol.iterator]()

        // TODO: Expose standard errors
        const {value: first, done: none} = matches.next()

        if (none) {
            throw new Error(`No value found for predicate ${p} on term ${anchor.term.value}`)
        }

        if (!matches.next().done) {
            throw new Error(`More than one value for predicate ${p} on term ${anchor.term.value}`)
        }

        return valueMapping(new TermWrapper(first.object, anchor.dataset, anchor.factory))
    }

    export function singularNullable<T>(anchor: TermWrapper, p: string, _?: T, valueMapping?: IValueMapping<T>): any {
        if (valueMapping === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor.term, predicate)) {
            return valueMapping(new TermWrapper(q.object, anchor.dataset, anchor.factory))
        }
    }

    export function overwrite<T>(anchor: TermWrapper, p: string, value?: T, _?: IValueMapping<T>, termMapping?: ITermMapping<T>): any {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        return overwriteNullable(anchor, p, value, undefined, termMapping)
    }

    export function overwriteNullable<T>(anchor: TermWrapper, p: string, value?: T, _?: IValueMapping<T>, termMapping?: ITermMapping<T>): any {
        if (termMapping === undefined) {
            throw new Error
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor.term, predicate)) {
            anchor.dataset.delete(q)
        }

        // TODO: TermMapping undefined: Return after deleting quads if undefined
        if (value === undefined) {
            return
        }

        // TODO: Do we really need to test if anchor.term is a Quad Subject here?
        // @Samu I imagine this is tested at instantiation time in the constructor if at all
        if (!isQuadSubject(anchor.term)) {
            return // TODO: throw error?
        }

        // TODO: TermMapping undefined: the term mapping is not invoked if undefined
        const o = termMapping(value, anchor.dataset, anchor.factory)

        if (o === undefined) {
            return // TODO: throw error?
        }

        if (!isQuadObject(o.term)) {
            return // TODO: throw error?
        }

        const q = anchor.factory.quad(anchor.term, predicate, o.term)
        anchor.dataset.add(q)
    }

    export function objects<T>(anchor: TermWrapper, p: string, _?: T, valueMapping?: IValueMapping<T>, termMapping?: ITermMapping<T>): any {
        if (valueMapping === undefined) {
            throw new Error // TODO: Describe
        }

        if (termMapping === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingSet(anchor, p, valueMapping, termMapping)
    }

    export function map<TKey, TValue>(anchor: TermWrapper, p: string, _?: [TKey, TValue], valueMapping?: IValueMapping<[TKey, TValue]>, termMapping?: ITermMapping<[TKey, TValue]>): any {
        if (valueMapping === undefined) {
            throw new Error // TODO: Describe
        }

        if (termMapping === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingMap(anchor, p, valueMapping, termMapping)
    }
}

function isQuadSubject(term: Term): term is Quad_Subject {
    return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
}

function isQuadObject(term: Term): term is Quad_Object {
    return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
}
