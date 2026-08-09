import type { AsyncDatasetCore, BaseQuad, DataFactory, DatasetCore, Literal, NamedNode, Term } from "@rdfjs/types"
import type { IRdfJsTerm } from "../type/IRdfJsTerm.js"

/**
 * The asynchronous counterpart of {@link TermWrapper}. It is the base class of all models that represent a mapping from RDF to JavaScript when the underlying dataset can only be accessed asynchronously, for example because it lives on disk or behind the network. It _is_ an {@link Term | RDF/JS term} (or node) that also has a reference to both the {@link AsyncDatasetCore | asynchronous dataset} that is the context of (i.e. contains) the term and to a factory that can be used to create additional terms.
 *
 * @remarks
 * Members that only inspect the wrapped term itself ({@link termType}, {@link value}, {@link equals} and friends) are synchronous, because they never touch the dataset. Everything that reads from or writes to the dataset goes through the {@link IAsyncTermAsValueMapping | asynchronous mapping functions}, which return {@link Promise | promises}.
 *
 * Because JavaScript property setters cannot return values, write mappings on asynchronous models are conventionally exposed as `setX(value)` methods returning a {@link Promise}, instead of `set x(value)` accessors. See relevant example.
 *
 * Like {@link TermWrapper}, this class contains all members of all types derived from {@link Term}, so instances can be used _as_ instances of any term type.
 *
 * @example Basic usage
 * The basic pattern of working with this class is to extend it and add accessors (returning promises) and mutator methods that expose data from the underlying RDF:
 * ```ts
 * class SomeClass extends AsyncTermWrapper {
 *   get someProperty(): Promise<string> {
 *     return AsyncRequiredFrom.subjectPredicate(this, "http://example.com/someProperty", AsyncLiteralAs.string)
 *   }
 *
 *   setSomeProperty(value: string): Promise<void> {
 *     return AsyncRequiredAs.object(this, "http://example.com/someProperty", value, LiteralFrom.string)
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
 * const dataset: AsyncDatasetCore // which has the RDF above loaded
 * const instance = new SomeClass("http://example.com/someSubject", dataset, DataFactory)
 *
 * const value = await instance.someProperty // contains "some value"
 *
 * await instance.setSomeProperty("some other value") // underlying RDF is now <someSubject> <someProperty> "some other value" .
 * ```
 *
 * @example Wrapping a synchronous dataset
 * Any synchronous RDF/JS {@link DatasetCore} can be exposed through the asynchronous surface by wrapping it in an {@link AsyncDatasetCore}:
 * ```ts
 * const store: DatasetCore // e.g. an n3 store with data loaded
 * const instance = new SomeClass("http://example.com/someSubject", new AsyncDatasetCore(store), DataFactory)
 * ```
 *
 * @example Using instances of AsyncTermWrapper as instances of RDF/JS Term
 * Since this class implements all members of all term types (named nodes, literals, blank nodes etc.), it can be cast to an RDF/JS Term:
 * ```ts
 * let instance: AsyncTermWrapper
 *
 * // Our instance cast as Term
 * const term = instance as Term
 * ```
 *
 * @see
 * - {@link TermWrapper}
 * - [RDF/JS Data model specification](https://rdf.js.org/data-model-spec/)
 */
export class AsyncTermWrapper implements IRdfJsTerm {
    private readonly original: Term
    private readonly _dataset: AsyncDatasetCore
    private readonly _factory: DataFactory

    /**
     * Creates a new instance of {@link AsyncTermWrapper}.
     *
     * @param term The IRI of a named node that is the original term being wrapped.
     * @param dataset The asynchronous dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     */
    public constructor(term: string, dataset: AsyncDatasetCore, factory: DataFactory)

    /**
     * Creates a new instance of {@link AsyncTermWrapper}.
     *
     * @param term The original term being wrapped.
     * @param dataset The asynchronous dataset that contains the term being wrapped.
     * @param factory A collection of methods for creating terms.
     */
    public constructor(term: Term, dataset: AsyncDatasetCore, factory: DataFactory)

    public constructor(term: string | Term, dataset: AsyncDatasetCore, factory: DataFactory) {
        this.original = typeof term === "string" ? factory.namedNode(term) : term
        this._dataset = dataset
        this._factory = factory
    }

    /**
     * The asynchronous dataset that contains this term.
     *
     * This accessor provides access to the underlying RDF graph that is the containing context of a node mapped to JavaScript by instances of this class.
     *
     * @remarks
     * This property plays the same role as {@link TermWrapper.dataset}, except that the dataset it references can only be read from and written to asynchronously: its lookup and mutation methods return {@link Promise | promises} and its quads are consumed with `for await`.
     */
    public get dataset(): AsyncDatasetCore {
        return this._dataset
    }

    /**
     * The data factory this instance was instantiated with. A collection of methods that can be used to create terms by this or subsequent wrappers.
     *
     * @remarks
     * Term creation is synchronous even on the asynchronous surface, because terms exist independently of any dataset.
     */
    public get factory(): DataFactory {
        return this._factory
    }

    /**
     * The well-known property containing a string that represents the type of this object.
     */
    public get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    //#region Implementation of RDF/JS Term

    public get termType(): Term["termType"] {
        return this.original.termType
    }

    public get value(): string {
        return this.original.value
    }

    public equals(other: Term | null | undefined): boolean {
        return this.original.equals(other)
    }

    //#region Implementation of RDF/JS Literal

    public get language(): string {
        return (this.original as Literal).language
    }

    public get direction(): Literal["direction"] {
        return (this.original as Literal).direction
    }

    public get datatype(): NamedNode {
        return (this.original as Literal).datatype
    }

    //#endregion

    //#region Implementation of RDF/JS Quad

    public get subject(): Term {
        return (this.original as BaseQuad).subject
    }

    public get predicate(): Term {
        return (this.original as BaseQuad).predicate
    }

    public get object(): Term {
        return (this.original as BaseQuad).object
    }

    public get graph(): Term {
        return (this.original as BaseQuad).graph
    }

    //#endregion

    //#endregion
}
