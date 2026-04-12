import type { DataFactory, DatasetCore, Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { ITermWrapperConstructor } from "./type/ITermWrapperConstructor.js"

import { RDF } from "./vocabulary/RDF.js"
import { TermWrapper } from "./TermWrapper.js"

export class DatasetWrapper implements DatasetCore {
    //#region DatasetCore

    public constructor(private readonly dataset: DatasetCore, protected readonly factory: DataFactory) {
    }

    public get size(): number {
        return this.dataset.size
    }

    public [Symbol.iterator](): Iterator<Quad> {
        return this.dataset[Symbol.iterator]()
    }

    public add(quad: Quad): this {
        this.dataset.add(quad)
        return this
    }

    public delete(quad: Quad): this {
        this.dataset.delete(quad)
        return this
    }

    public has(quad: Quad): boolean {
        return this.dataset.has(quad)
    }

    public match(subject?: Term, predicate?: Term, object?: Term, graph?: Term): DatasetCore {
        return this.dataset.match(subject, predicate, object, graph)
    }

    //#endregion

    //#region Utilities

    protected subjectsOf<T extends TermWrapper>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T & Quad_Subject> {
        return this.matchSubjectsOf(termWrapper, this.factory.namedNode(predicate))
    }

    protected objectsOf<T extends TermWrapper>(predicate: string, termWrapper: ITermWrapperConstructor<T>): Iterable<T & Quad_Object> {
        return this.matchObjectsOf(termWrapper, undefined, this.factory.namedNode(predicate))
    }

    protected instancesOf<T extends TermWrapper>(klass: string, constructor: ITermWrapperConstructor<T>): Iterable<T & Quad_Subject> {
        return this.matchSubjectsOf(constructor, this.factory.namedNode(RDF.type), this.factory.namedNode(klass))
    }

    protected* matchSubjectsOf<T extends TermWrapper>(termWrapper: ITermWrapperConstructor<T>, predicate?: Term, object?: Term, graph?: Term): Iterable<T & Quad_Subject> {
        for (const q of this.match(undefined, predicate, object, graph)) {
            yield termWrapper.from(q.subject, this, this.factory) as unknown as T & Quad_Subject
        }
    }

    protected* matchObjectsOf<T extends TermWrapper>(termWrapper: ITermWrapperConstructor<T>, subject?: Term, predicate?: Term, graph?: Term): Iterable<T & Quad_Object> {
        for (const q of this.match(subject, predicate, undefined, graph)) {
            yield termWrapper.from(q.object, this, this.factory) as unknown as T & Quad_Object
        }
    }

    //#endregion

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
