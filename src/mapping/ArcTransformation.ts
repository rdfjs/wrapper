import { TermWrapper } from "../TermWrapper.js"
import { WrappingMap } from "../WrappingMap.js"
import { WrappingSet } from "../WrappingSet.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"

export namespace ArcTransformation {
    export function singular<T>(anchor: TermWrapper, p: string, _?: T, termAs?: ITermAsValueMapping<T>): any {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)
        const matches = anchor.dataset.match(anchor as Term, predicate)[Symbol.iterator]()

        // TODO: Expose standard errors
        const {value: first, done: none} = matches.next()

        if (none) {
            throw new Error(`No value found for predicate ${p} on term ${anchor.value}`)
        }

        if (!matches.next().done) {
            throw new Error(`More than one value for predicate ${p} on term ${anchor.value}`)
        }

        return termAs(new TermWrapper(first.object, anchor.dataset, anchor.factory))
    }

    export function singularNullable<T>(anchor: TermWrapper, p: string, _?: T, termAs?: ITermAsValueMapping<T>): any {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            return termAs(new TermWrapper(q.object, anchor.dataset, anchor.factory))
        }
    }

    export function overwrite<T>(anchor: TermWrapper, p: string, value?: T, _?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
        if (value === undefined) {
            throw new Error("value cannot be undefined")
        }

        return overwriteNullable(anchor, p, value, undefined, termFrom)
    }

    export function overwriteNullable<T>(anchor: TermWrapper, p: string, value?: T, _?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
        if (termFrom === undefined) {
            throw new Error
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            anchor.dataset.delete(q)
        }

        // TODO: TermMapping undefined: Return after deleting quads if undefined
        if (value === undefined) {
            return
        }

        // TODO: Do we really need to test if anchor is a Quad Subject here?
        // @Samu I imagine this is tested at instantiation time in the constructor if at all
        if (!isQuadSubject(anchor as Term)) {
            return // TODO: throw error?
        }

        // TODO: TermMapping undefined: the term mapping is not invoked if undefined
        const o = termFrom(value, anchor.factory)

        if (o === undefined) {
            return // TODO: throw error?
        }

        if (!isQuadObject(o as Term)) {
            return // TODO: throw error?
        }

        const q = anchor.factory.quad(anchor as Quad_Subject, predicate, o as Quad_Object)
        anchor.dataset.add(q)
    }

    export function objects<T>(anchor: TermWrapper, p: string, _?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingSet(anchor, p, termAs, termFrom)
    }

    export function map<TKey, TValue>(anchor: TermWrapper, p: string, _?: [TKey, TValue], termAs?: ITermAsValueMapping<[TKey, TValue]>, termFrom?: ITermFromValueMapping<[TKey, TValue]>): any {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingMap(anchor, p, termAs, termFrom)
    }
}

function isQuadSubject(term: Term): term is Quad_Subject {
    return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
}

function isQuadObject(term: Term): term is Quad_Object {
    return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
}
