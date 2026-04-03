import * as RDF from "@rdfjs/types"
import * as Vocab from "./vocabulary/RDF.js"

namespace X {
    class TermSet implements Set<RDF.Term> {
        private readonly thing: RDF.Term[] = []

        get [Symbol.toStringTag](): string {
            return this.constructor.name
        }

        get size(): number {
            return this.thing.length
        }

        [Symbol.iterator](): SetIterator<RDF.Term> {
            return this.values()
        }

        add(value: RDF.Term): this {
            if (!this.has(value)) {
                this.thing.push(value)
            }

            return this
        }

        clear(): void {
            this.thing.length = 0
        }

        delete(value: RDF.Term): boolean {
            for (let i = 0; i < this.thing.length; i++) {
                const t = this.thing[i]!
                if (t.equals(value)) {
                    this.thing.splice(i, 1)

                    return true
                }
            }

            return false
        }

        * entries(): SetIterator<[RDF.Term, RDF.Term]> {
            for (const term of this) {
                yield [term, term]
            }
        }

        forEach(callbackfn: (value: RDF.Term, value2: RDF.Term, set: Set<RDF.Term>) => void, thisArg?: any): void {
            for (const term of this) {
                callbackfn.call(thisArg, term, term, this)
            }
        }

        has(value: RDF.Term): boolean {
            for (let i = 0; i < this.thing.length; i++) {
                const t = this.thing[i]!
                if (t.equals(value)) {
                    return true
                }
            }

            return false
        }

        keys(): SetIterator<RDF.Term> {
            return this.values()
        }

        values(): SetIterator<RDF.Term> {
            return this.thing[Symbol.iterator]()
        }
    }

    class TermMap<T> implements Map<RDF.Term, T> {
        private valueIndex: T[] = []
        private keyIndex = new TermSet

        get [Symbol.toStringTag](): string {
            return this.constructor.name
        }

        get size(): number {
            return this.valueIndex.length
        }

        [Symbol.iterator](): MapIterator<[RDF.Term, T]> {
            return this.entries()
        }

        clear(): void {
            this.keyIndex.clear()
            this.valueIndex.length = 0
        }

        delete(key: RDF.Term): boolean {
            throw new Error("Not implemented")
        }

        * entries(): MapIterator<[RDF.Term, T]> {
            let i = 0
            for (const keyTerm of this.keyIndex) {
                yield [keyTerm, this.valueIndex[i++]!]
            }
        }

        forEach(callbackfn: (value: T, key: RDF.Term, map: Map<RDF.Term, T>) => void, thisArg?: any): void {
            for (const [key, value] of this) {
                callbackfn.call(thisArg, value, key, this)
            }
        }

        get(key: RDF.Term): T | undefined {
            let i = 0
            for (const keyTerm of this.keyIndex) {
                if (keyTerm.equals(key)) {
                    return this.valueIndex[i]
                }

                i++
            }

            return undefined
        }

        has(key: RDF.Term): boolean {
            return this.keyIndex.has(key)
        }

        keys(): MapIterator<RDF.Term> {
            return this.keyIndex[Symbol.iterator]()
        }

        set(key: RDF.Term, value: T): this {
            if (!this.has(key)) {
                this.keyIndex.add(key)
            }

            let i = 0
            for (const keyTerm of this.keyIndex) {
                if (keyTerm.equals(key)) {
                    break
                }
                i++
            }

            this.valueIndex[i] = value
            return this
        }

        values(): MapIterator<T> {
            return this.valueIndex[Symbol.iterator]()
        }
    }

    enum QuadPosition {
        subject,
        predicate,
        object,
        graph,
    }

    class NewWrappingSet<T> implements Set<T> {
        constructor(
            private readonly termToValue: ITermAsValueMapping<T>,
            private readonly valueToTerm: ITermFromValueMapping<T>,
            private readonly dataset: RDF.DatasetCore,
            private readonly factory: RDF.DataFactory,
            private readonly position: QuadPosition,
            private readonly subject?: RDF.Term,
            private readonly predicate?: RDF.Term,
            private readonly object?: RDF.Term,
            private readonly graph?: RDF.Term
        ) {
            switch (position) {
                case QuadPosition.subject:
                    if (subject !== undefined) {
                        throw new Error("Static subject incompatible with value in subject position")
                    }

                    if (predicate === undefined || object === undefined) {
                        throw new Error("Static predicate and object required for value in subject position")
                    }

                    break

                case QuadPosition.predicate:
                    if (predicate !== undefined) {
                        throw new Error("Static predicate incompatible with value in predicate position")
                    }

                    if (subject === undefined || object === undefined) {
                        throw new Error("Static subject and object required for value in predicate position")
                    }

                    break

                case QuadPosition.object:
                    if (object !== undefined) {
                        throw new Error("Static object incompatible with value in object position")
                    }

                    if (subject === undefined || predicate === undefined) {
                        throw new Error("Static subject and predicate required for value in object position")
                    }

                    break

                case QuadPosition.graph:
                    if (graph !== undefined) {
                        throw new Error("Static graph incompatible with value in graph position")
                    }

                    if (subject === undefined || predicate === undefined || object === undefined) {
                        throw new Error("Static subject, predicate and object required for value in graph position")
                    }

                    break;
            }
        }

        add(value: T) {
            this.dataset.add(this.quad(value))
            return this
        }

        clear() {
            for (const quad of this.matches) {
                this.dataset.delete(quad)
            }
        }

        delete(value: T): boolean {
            if (!this.has(value)) {
                return false
            }

            const term = this.term(value)
            const matches = this.dataset.match(
                (this.position === QuadPosition.subject ? term : this.subject) as RDF.Quad_Subject,
                (this.position === QuadPosition.predicate ? term : this.predicate) as RDF.Quad_Predicate,
                (this.position === QuadPosition.object ? term : this.object) as RDF.Quad_Object,
                (this.position === QuadPosition.graph ? term : this.graph) as RDF.Quad_Graph,
            )

            for (const quad of matches) {
                this.dataset.delete(quad)
            }

            return true
        }

        forEach(cb: (item: T, index: T, set: Set<T>) => void, thisArg?: any): void {
            for (const item of this) {
                cb.call(thisArg, item, item, this)
            }
        }

        has(value: T): boolean {
            return this.dataset.has(this.quad(value))
        }

        get size(): number {
            return this.matches.size
        }

        [Symbol.iterator](): SetIterator<T> {
            return this.values()
        }

        * entries(): SetIterator<[T, T]> {
            for (const value of this) {
                yield [value, value]
            }
        }

        keys(): SetIterator<T> {
            return this.values()
        }

        * values(): SetIterator<T> {
            for (const quad of this.matches) {
                yield this.termToValue.call(new TermWithContext(this.pick(quad), this.dataset, this.factory))
            }
        }

        get [Symbol.toStringTag](): string {
            return this.constructor.name
        }

        private get matches(): RDF.DatasetCore {
            return this.dataset.match(
                this.subject as RDF.Quad_Subject,
                this.predicate as RDF.Quad_Predicate,
                this.object as RDF.Quad_Object,
                this.graph as RDF.Quad_Graph,
            )
        }

        private quad(value: T): RDF.Quad {
            const term = this.term(value)
            return this.factory.quad(
                (this.position === QuadPosition.subject ? term : this.subject) as RDF.Quad_Subject,
                (this.position === QuadPosition.predicate ? term : this.predicate) as RDF.Quad_Predicate,
                (this.position === QuadPosition.object ? term : this.object) as RDF.Quad_Object,
                (this.position === QuadPosition.graph ? term : this.graph) as RDF.Quad_Graph,
            )
        }

        private term(value: T): RDF.Term {
            return this.valueToTerm.call(value, this.factory) as RDF.Term
        }

        private pick(quad: RDF.Quad): RDF.Term {
            switch (this.position) {
                case QuadPosition.subject:
                    return quad.subject
                case QuadPosition.predicate:
                    return quad.predicate
                case QuadPosition.object:
                    return quad.object
                case QuadPosition.graph:
                    return quad.graph
            }

        }
    }

    interface ITermConstructor<T extends TermWithContext> {
        new(term: RDF.Term, dataset: RDF.DatasetCore, factory: RDF.DataFactory): T
    }

    interface ITerm {
        readonly termType: RDF.Term["termType"]
        readonly value: RDF.Term["value"]
        readonly language: RDF.Literal["language"]
        readonly direction: RDF.Literal["direction"]
        readonly datatype: RDF.Literal["datatype"]
        readonly subject: RDF.BaseQuad["subject"]
        readonly predicate: RDF.BaseQuad["predicate"]
        readonly object: RDF.BaseQuad["object"]
        readonly graph: RDF.BaseQuad["graph"]

        equals(other: RDF.Term | null | undefined): boolean
    }

    interface ITermAsValueMapping<T> {
        (this: TermWithContext): T
    }

    interface ITermFromValueMapping<T> {
        (this: T, factory: RDF.DataFactory): RDF.Term
    }

    interface IArcTransformation<T> {
        (this: TermWithContext, predicate: string, value?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any
    }

    interface ITermExtractor {
        (this: RDF.Quad): RDF.Term
    }

    namespace TermExtractor {
        export function subject(this: RDF.Quad) {
            return this.subject
        }

        export function predicate(this: RDF.Quad) {
            return this.predicate
        }

        export function object(this: RDF.Quad) {
            return this.object
        }

        export function graph(this: RDF.Quad) {
            return this.graph
        }
    }

    namespace ArcTransformation {
        export function singular<T>(this: TermWithContext, p: string, _?: T, termAs?: ITermAsValueMapping<T>): any {
            if (termAs === undefined) {
                throw new Error // TODO: Describe
            }

            const predicate = this.factory.namedNode(p)
            const matches = this.dataset.match(this as RDF.Term, predicate)[Symbol.iterator]()

            // TODO: Expose standard errors
            const {value: first, done: none} = matches.next()

            if (none) {
                throw new Error(`No value found for predicate ${p} on term ${this.value}`)
            }

            if (!matches.next().done) {
                throw new Error(`More than one value for predicate ${p} on term ${this.value}`)
            }

            return termAs.call(new TermWithContext(first.object, this.dataset, this.factory))
        }

        export function objects<T>(this: TermWithContext, p: string, _?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
            if (termAs === undefined) {
                throw new Error // TODO: Describe
            }

            if (termFrom === undefined) {
                throw new Error // TODO: Describe
            }

            return new NewWrappingSet(
                termAs,
                termFrom,
                this.dataset,
                this.factory,
                QuadPosition.object,
                this as RDF.Term,
                this.factory.namedNode(p))
        }
    }

    abstract class BaseTerm implements ITerm {
        protected constructor(private readonly original: RDF.Term) {
        }

        get termType() {
            return this.original.termType
        }

        get value() {
            return this.original.value
        }

        get language() {
            return (this.original as RDF.Literal).language
        }

        get direction() {
            return (this.original as RDF.Literal).direction
        }

        get datatype() {
            return (this.original as RDF.Literal).datatype
        }

        get subject() {
            return (this.original as RDF.BaseQuad).subject
        }

        get predicate() {
            return (this.original as RDF.BaseQuad).predicate
        }

        get object() {
            return (this.original as RDF.BaseQuad).object
        }

        get graph() {
            return (this.original as RDF.BaseQuad).graph
        }

        equals(other: RDF.Term | null | undefined) {
            return this.original.equals(other);
        }
    }

    class TermWithContext extends BaseTerm {
        public constructor(term: string, dataset: RDF.DatasetCore, factory: RDF.DataFactory);
        public constructor(term: RDF.Term, dataset: RDF.DatasetCore, factory: RDF.DataFactory);
        public constructor(term: string | RDF.Term, public readonly dataset: RDF.DatasetCore, public readonly factory: RDF.DataFactory) {
            super(typeof term === "string" ? factory.namedNode(term) : term)
        }
    }

    abstract class BaseDataset implements RDF.DatasetCore {
        constructor(private readonly dataset: RDF.DatasetCore, protected readonly factory: RDF.DataFactory) {
        }

        public get size() {
            return this.dataset.size
        }

        public [Symbol.iterator]() {
            return this.dataset[Symbol.iterator]()
        }

        public add(quad: RDF.Quad) {
            this.dataset.add(quad)
            return this
        }

        public delete(quad: RDF.Quad) {
            this.dataset.delete(quad)
            return this
        }

        public has(quad: RDF.Quad) {
            return this.dataset.has(quad)
        }

        public match(subject?: RDF.Term, predicate?: RDF.Term, object?: RDF.Term, graph?: RDF.Term) {
            return this.dataset.match(subject, predicate, object, graph)
        }
    }

    class Dataset extends BaseDataset {
        protected instancesOf<T extends TermWithContext>(className: string, constructor: ITermConstructor<T>): Iterable<T> {
            return this.matchSubjectsOf(constructor, this.factory.namedNode(Vocab.RDF.type), this.factory.namedNode(className))
        }

        protected objectsOf<T extends TermWithContext>(predicate: string, term: ITermConstructor<T>): Iterable<T> {
            return this.matchObjectsOf(term, this.factory.namedNode(predicate))
        }

        protected matchSubjectsOf<T extends TermWithContext>(term: ITermConstructor<T>, predicate?: RDF.Term, object?: RDF.Term, graph?: RDF.Term): Iterable<T> {
            return this.matchesOf<T>(term, TermExtractor.subject, undefined, predicate, object, graph)
        }

        protected matchObjectsOf<T extends TermWithContext>(term: ITermConstructor<T>, subject?: RDF.Term, predicate?: RDF.Term, graph?: RDF.Term): Iterable<T> {
            return this.matchesOf<T>(term, TermExtractor.object, subject, predicate, undefined, graph)
        }

        protected* matchesOf<T extends TermWithContext>(constructor: ITermConstructor<T>, extractor: ITermExtractor, subject?: RDF.Term, predicate?: RDF.Term, object?: RDF.Term, graph?: RDF.Term): Iterable<T> {
            const seen = new TermSet

            for (const quad of this.match(subject, predicate, object, graph)) {
                const term = extractor.call(quad)

                if (seen.has(term)) {
                    continue
                }

                seen.add(term)
                yield new constructor(term, this, this.factory)
            }
        }
    }

    class Term extends TermWithContext {
        protected singular<T>(p: string, termAs: ITermAsValueMapping<T>): T {
            return this.process(ArcTransformation.singular, p, undefined, termAs)
        }

        protected objects<T>(p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
            return this.process(ArcTransformation.objects, p, undefined, termAs, termFrom)
        }

        protected process<T>(transformation: IArcTransformation<T>, predicate: string, value?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
            return transformation.call(this, predicate, value, termAs, termFrom)
        }
    }
}
