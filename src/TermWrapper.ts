import { pathOf, withPath } from "./jsonPath.js"
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

    /**
     * Converts this instance to a plain object for JSON serialization. This method is called by {@link JSON.stringify}; there is usually no reason to call it directly.
     *
     * The result has one property for each accessor (getter) that the classes derived from {@link TermWrapper} declare. The members of {@link TermWrapper} itself (the RDF/JS term, the dataset and the factory) are not included. Methods, accessors with symbol keys and instance fields are not included either.
     *
     * @remarks
     * The behaviour is as close as possible to that of {@link JSON.stringify} on an instance of an ordinary class:
     * - The order of the properties is that of ordinary class fields: properties of base classes come before properties of derived classes, in the order of declaration. An accessor that a derived class overrides keeps the position of the base declaration and is read only once.
     * - The result is shallow. The property values (other wrappers, sets, lists and maps included) are returned as they are, and {@link JSON.stringify} descends into them. The `replacer` and `space` arguments thus work as usual.
     * - A node that can be reached along more than one path is serialized in full each time, because JSON has no concept of identity.
     * - A node that can be reached from itself cannot be serialized, as is the case with all circular structures.
     *
     * @returns A new plain object that contains the values of the accessors of this instance.
     *
     * @throws {@link !TypeError TypeError} If the term of this instance is also the term of one of the wrappers that contain it, i.e. the underlying graph has a cycle.
     *
     * @example
     * ```ts
     * class Person extends TermWrapper {
     *   get name(): string {
     *     return RequiredFrom.subjectPredicate(this, "http://example.com/name", LiteralAs.string)
     *   }
     *
     *   get knows(): Set<Person> {
     *     return SetFrom.subjectPredicate(this, "http://example.com/knows", TermAs.instance(Person), TermFrom.instance)
     *   }
     * }
     *
     * JSON.stringify(alice) // {"name":"Alice","knows":[{"name":"Bob","knows":[]}]}
     * ```
     */
    toJSON(): Record<string, unknown> {
        const ancestors = pathOf(this)

        // Compare by term and not by identity: each read of a mapped property creates a new wrapper, so the same instance is never seen twice.
        // Look only at ancestors and not at everything serialized so far: a node that occurs again in a different branch is not a cycle.
        if (ancestors.some(ancestor => ancestor.equals(this as Term))) {
            throw new TypeError("Converting circular structure to JSON")
        }

        const path = [...ancestors, this as Term]

        // The names of the accessors of each class between this instance and TermWrapper, base class first (the order in which ordinary class fields are created).
        const names: string[][] = []
        for (let prototype = Object.getPrototypeOf(this); prototype !== TermWrapper.prototype; prototype = Object.getPrototypeOf(prototype)) {
            names.unshift(Object
                .entries(Object.getOwnPropertyDescriptors(prototype))
                .filter(([, {get}]) => get !== undefined)
                .map(([name]) => name))
        }

        // The set removes the names of overridden accessors, so that each is read once and stays at the position of its first declaration.
        // Object.fromEntries defines properties and does not assign them, so a name like "__proto__" becomes an ordinary property.
        return Object.fromEntries(Array.from(new Set(names.flat()), name => [name, withPath(Reflect.get(this, name), path)]))
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
