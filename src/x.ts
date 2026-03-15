import * as RDF from "@rdfjs/types"
import * as Vocab from "./vocabulary/RDF.js"

namespace X {
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

    interface ITermToValue<T> {
        (this: TermWithContext): T
    }

    interface IValueToTerm<T> {
        (this: T, dataset: RDF.DatasetCore, factory: RDF.DataFactory): TermWithContext | undefined
    }

    interface IArcTransformation<T> {
        (this: TermWithContext, predicate: string, value?: T, valueMapping?: ITermToValue<T>, termMapping?: IValueToTerm<T>): any
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
        export function singular<T>(this: TermWithContext, p: string, _?: T, valueMapping?: ITermToValue<T>): any {
            if (valueMapping === undefined) {
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

            return valueMapping.call(new TermWithContext(first.object, this.dataset, this.factory))
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
        protected instancesOf<T extends TermWithContext>(predicate: string, constructor: ITermConstructor<T>): Iterable<T> {
            return this.matchSubjectsOf(constructor, this.factory.namedNode(Vocab.RDF.type), this.factory.namedNode(predicate))
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

        protected* matchesOf<T extends TermWithContext>(term: ITermConstructor<T>, from: ITermExtractor, subject?: RDF.Term, predicate?: RDF.Term, object?: RDF.Term, graph?: RDF.Term): Iterable<T> {
            for (const quad of this.match(subject, predicate, object, graph)) {
                yield new term(from.call(quad), this, this.factory)
            }
        }
    }

    class Term extends TermWithContext {
        protected singular<T>(p: string, valueMapping: ITermToValue<T>): T {
            return this.process(ArcTransformation.singular, p, undefined, valueMapping)
        }

        protected process<T>(transformation: IArcTransformation<T>, predicate: string, value?: T, valueMapping?: ITermToValue<T>, termMapping?: IValueToTerm<T>): any {
            return transformation.call(this, predicate, value, valueMapping, termMapping)
        }
    }
}
