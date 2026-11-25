import type { BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Quad_Subject, Term } from "@rdfjs/types"
import type { IRdfJsTerm } from "./type/IRdfJsTerm.js"

/**
 * `TermWrapper` is one of the two central constructs of this library. It is the base class of all models that represent a mapping from RDF to JavaScript. It _is_ an {@link Term | RDF/JS term} (or node) that also has a reference to both the dataset (or graph) that is the context of (i.e. contains) the term and to a factory that can be used to create additional terms.
 *
 * @remarks
 * This class contains all members of all types derived from {@link Term}. This is so instances of this class can be used _as_ instances of any term type. See relevant example.
 *
 * @example Basic usage
 * The basic pattern of working with this class is to simply extend it and add accessors and mutators (both optional) that expose data from the underlying RDF:
 * ```ts
 * class SomeClass extends TermWrapper {
 *   get someProperty(): string {
 *     return RequiredFrom.subjectPredicate(this, "http://example.com/someProperty", LiteralAs.string)
 *   }
 *
 *   set someProperty(value: string) {
 *     RequiredAs.object(this, "http://example.com/someProperty", value, LiteralFrom.string)
 *   }
 * }
 * ```
 *
 * Assume the following RDF data:
 * ```turtle
 * BASE <http://example.com/>
 *
 * <someSubject> <someProperty> "some value" .
 * ```
 *
 * We can work with this data in JavaScript and TypeScript as follows:
 * ```ts
 * const dataset: DatasetCore // which has the RDF above loaded
 * const instance = new SomeClass("http://example.com/someSubject", dataset, DataFactory)
 *
 * const value = instance.someProperty // contains "some value"
 *
 * instance.someProperty = "some other value" // underlying RDF is now <someSubject> <someProperty> "some other value" .
 * ```
 *
 * @example Using instances of TermWrapper as instances of RDF/JS Term
 * Since this class implements all members of all term types (named nodes, literals, blank nodes etc.), it can be cast to an RDF/JS Term:
 * ```ts
 * let instance: TermWrapper
 *
 * // Our instance cast as Term
 * const term = instance as Term
 * ```
 *
 * @example Using instances of TermWrapper to create quads
 * Instances of this class can be used anywhere an RDF/JS Term can be used, which includes creating quads:
 * ```ts
 * let instance: TermWrapper
 * let factory: DataFactory
 * const predicate = factory.namedNode("http://example.com/p")
 * const object = factory.literal("o")
 *
 * // Our instance used as subject when creating a quad
 * factory.quad(instance as Quad_Subject, predicate, object)
 * ```
 *
 * @example Using instances of TermWrapper to match graph patterns
 * Instances of this class can be used anywhere an RDF/JS Term can be used, which includes matching quads in a dataset:
 * ```ts
 * let instance: TermWrapper
 * let dataset: DatasetCore
 *
 * // Our instance used as subject when matching statements in a dataset
 * dataset.match(instance as Term)
 * ```
 */
export class TermWrapper implements IRdfJsTerm {
    private readonly original: Term
    private readonly _dataset: DatasetCore
    private readonly _factory: DataFactory

    /**
     * Creates a new instance of {@link TermWrapper}.
     *
     * @param term The IRI of a named node that is the original term being wrapped.
     * @param dataset The dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     */
    constructor(term: string, dataset: DatasetCore, factory: DataFactory)

    /**
     * Creates a new instance of {@link TermWrapper}.
     *
     * @param term The original term being wrapped.
     * @param dataset The dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     */
    constructor(term: Term, dataset: DatasetCore, factory: DataFactory)

    constructor(term: string | Term, dataset: DatasetCore, factory: DataFactory) {
        this.original = typeof term === "string" ? factory.namedNode(term) : term
        this._dataset = dataset
        this._factory = factory
    }

    //#region Static factory

    /**
     * Creates a new instance of this class (or subclass) from an IRI, typed as both the wrapper and the {@link NamedNode} it wraps.
     *
     * @remarks
     * This factory is equivalent to invoking the constructor directly, differing only in the return type: the constructor returns the declared instance type, whereas this factory returns the intersection of the (sub)class instance type and {@link NamedNode}. Because the result _is_ a {@link NamedNode} at the type level, it can be passed directly anywhere an RDF/JS {@link Term} is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @example Creating an instance of a subclass
     * Assume the following RDF data:
     * ```turtle
     * BASE <http://example.com/>
     *
     * <someSubject> <someProperty> "some value" .
     * ```
     * We can wrap the subject and use the wrapper directly as a named node:
     * ```ts
     * class SomeClass extends TermWrapper {
     *   get someProperty(): string {
     *     return RequiredFrom.subjectPredicate(this, "http://example.com/someProperty", LiteralAs.string)
     *   }
     * }
     *
     * const instance = SomeClass.from("http://example.com/someSubject", dataset, factory)
     * // instance is typed as SomeClass & NamedNode
     *
     * const value = instance.someProperty // contains "some value"
     * ```
     *
     * @example Using created instances directly as RDF/JS terms
     * In contrast to instances created with the constructor, no casts are required to use the result as a term:
     * ```ts
     * const instance = SomeClass.from("http://example.com/someSubject", dataset, factory)
     *
     * // Used as subject when creating a quad
     * factory.quad(instance, predicate, object)
     *
     * // Used as subject when matching statements in a dataset
     * dataset.match(instance)
     * ```
     *
     * @param term The IRI of a named node that is the original term being wrapped.
     * @param dataset The dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     * @returns A new instance of the class this method was invoked on, typed additionally as the {@link NamedNode} it wraps.
     *
     * @see
     * - [Named nodes in the RDF/JS Data model specification](https://rdf.js.org/data-model-spec/#namednode-interface)
     */
    public static from<This extends new (term: string, dataset: DatasetCore, factory: DataFactory) => any>(
        this: This,
        term: string,
        dataset: DatasetCore,
        factory: DataFactory,
    ): InstanceType<This> & NamedNode<string>

    /**
     * Creates a new instance of this class (or subclass), typed as both the wrapper and the type of the {@link Term} it wraps.
     *
     * @remarks
     * This factory is equivalent to invoking the constructor directly, differing only in the return type: the constructor returns the declared instance type, whereas this factory returns the intersection of the (sub)class instance type and the type of the `term` argument. Because the result _is_ a {@link Term} at the type level, it can be passed directly anywhere an RDF/JS term is expected — for example when creating quads with a {@link DataFactory} or when matching with {@link DatasetCore.match} — without casts.
     *
     * @example Wrapping a literal
     * The term type of the argument is preserved in the return type, so term-type-specific members are available without casts:
     * ```ts
     * const literal = factory.literal("some value", "en")
     * const instance = SomeClass.from(literal, dataset, factory)
     * // instance is typed as SomeClass & Literal
     *
     * const language = instance.language // contains "en"
     * ```
     *
     * @example Using created instances directly as RDF/JS terms
     * In contrast to instances created with the constructor, no casts are required to use the result as a term:
     * ```ts
     * const instance = SomeClass.from(factory.blankNode(), dataset, factory)
     *
     * // Used as subject when creating a quad
     * factory.quad(instance, predicate, object)
     *
     * // Used as subject when matching statements in a dataset
     * dataset.match(instance)
     * ```
     *
     * @param term The original term being wrapped.
     * @param dataset The dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     * @returns A new instance of the class this method was invoked on, typed additionally as the {@link Term} it wraps.
     *
     * @see
     * - [Terms in the RDF/JS Data model specification](https://rdf.js.org/data-model-spec/#term-interface)
     */
    public static from<T extends Term, This extends new (term: T, dataset: DatasetCore, factory: DataFactory) => any>(
        this: This,
        term: T,
        dataset: DatasetCore,
        factory: DataFactory,
    ): InstanceType<This> & T

    public static from(this: any, term: string | Term, dataset: DatasetCore, factory: DataFactory): any {
        return new this(term, dataset, factory)
    }

    //#endregion

    /**
     * The dataset that contains this term.
     *
     * This accessor provides access to the underlying RDF graph that is the containing context of a node mapped to JavaScript by instances of this class.
     *
     * @remarks
     * RDF/JS, like many other RDF frameworks, keeps terms and datasets separate. This means that terms do not hold a reference to a dataset they reside in (or were found in). This, in turn, means that a dataset must always be available, separate from the term, if either changes to the underlying data or further traversal of the underlying data is called for. In an object-oriented context however, where property chaining is idiomatic (i.e. `instance.property1.property2`), there is no way to supply the dataset when dereferencing a link in the chain.
     *
     * This property solves the problem by keeping a reference to the dataset.
     *
     * @exmaple
     * Using the dataset to modify information related to this node in the underlying data:
     * ```ts
     * class Book extends TermWrapper {
     *   set author(value: string) {
     *     const subject = this as Quad_Subject
     *     const predicate = this.factory.namedNode("http://example.com/author")
     *     const object = this.factory.literal(value)
     *     const oldAuthors = this.factory.quad(subject, predicate)
     *     const newAuthor = this.factory.quad(subject, predicate, object)
     *
     *     this.dataset.delete(oldAuthors)
     *     this.dataset.add(newAuthor)
     *   }
     * }
     * ```
     * Note: The above example operates on a low level to explain this property. Library users are more likely to interact with {@link OptionalAs}, {@link RequiredAs} and {@link LiteralFrom} for a better experience.
     *
     * @exmaple
     * Using the dataset to modify data related to this node in the underlying data:
     * ```ts
     * class Container extends TermWrapper {
     *   add(something: string) {
     *     const subject = this as Quad_Subject
     *     const predicate = this.factory.namedNode("http://example.com/contains")
     *     const object = this.factory.literal(something)
     *     const quad = this.factory.quad(subject, predicate, object)
     *
     *     this.dataset.add(quad)
     *   }
     * }
     * ```
     */
    get dataset(): DatasetCore {
        return this._dataset
    }

    /**
     * The data factory this instance was instantiated with. A collection of methods that can be used to create terms by this or subsequent wrappers.
     *
     * @exmaple
     * Using the factory to create a literal term from the current date and time:
     * ```ts
     * class Calendar extends TermWrapper {
     *   get currentDate(): Literal {
     *     const date = new Date().toISOString()
     *     const xsdDateTime = this.factory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime")
     *
     *     return this.factory.literal(date, xsdDateTime)
     *   }
     * }
     * ```
     *
     * @exmaple
     * Using the factory to create a quad:
     * ```ts
     * class Container extends TermWrapper {
     *   add(something: string) {
     *     const subject = this as Quad_Subject
     *     const predicate = this.factory.namedNode("http://example.com/contains")
     *     const object = this.factory.literal(something)
     *     const quad = this.factory.quad(subject, predicate, object)
     *
     *     this.dataset.add(quad)
     *   }
     * }
     * ```
     */
    get factory(): DataFactory {
        return this._factory
    }

    /**
     * The well-known property containing a string that represents the type of this object.
     */
    get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    //#region Implementation of RDF/JS Term

    get termType(): Term["termType"] {
        return this.original.termType
    }

    get value(): string {
        return this.original.value
    }

    equals(other: Term | null | undefined): boolean {
        return this.original.equals(other)
    }

    //#region Implementation of RDF/JS Literal

    get language(): string {
        return (this.original as Literal).language
    }

    get direction(): Literal["direction"] {
        return (this.original as Literal).direction
    }

    get datatype(): NamedNode {
        return (this.original as Literal).datatype
    }

    //#endregion

    //#region Implementation of RDF/JS Quad

    get subject(): Term {
        return (this.original as BaseQuad).subject
    }

    get predicate(): Term {
        return (this.original as BaseQuad).predicate
    }

    get object(): Term {
        return (this.original as BaseQuad).object
    }

    get graph(): Term {
        return (this.original as BaseQuad).graph
    }

    //#endregion

    //#endregion
}
