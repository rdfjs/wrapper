import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"
import type { TermWrapper } from "../TermWrapper.js"

/**
 * Represents the static side of term mapping classes that extend {@link TermWrapper}: a constructor signature combined with the {@link TermWrapper.from | from static factory}.
 *
 * Used by this library where constructors of mappers are accepted for implementing navigation properties that represent graph patterns on dataset and term wrappers.
 *
 * @template T - The type of the mapping class whose instance is created. Must derive from {@link TermWrapper}, which is also the default.
 * @param term - The underlying term being wrapped.
 * @param dataset - The dataset containing the wrapped term.
 * @param factory - The data factory used for creating new terms.
 * @returns An instance of the mapping class created when invoking the constructor.
 *
 * @remarks
 * Mapping classes do not need to define a constructor that matches this signature, because the base class has a publicly accessible, matching {@link TermWrapper.constructor | constructor}. Likewise, they do not need to define the {@link TermWrapper.from | from static factory}, because every class derived from {@link TermWrapper} inherits it automatically.
 *
 * The library invokes {@link TermWrapper.from} rather than the constructor where it can improve the created instance's type with the type of the term it wraps, for example in {@link DatasetWrapper.matchSubjectsOf} and {@link DatasetWrapper.matchObjectsOf}.
 *
 * @example Projecting from a dataset to a mapping class
 * Given the mapping
 * ```ts
 * class Person extends TermWrapper {
 *   get name(): string {
 *     return RequiredFrom.subjectPredicate(this, "name", LiteralAs.string)
 *   }
 * }
 *
 * class People extends DatasetWrapper {
 *   [Symbol.iterator](): Iterator<Quad> {
 *      return this.instancesOf("Person", Person) // 2nd param is an ITermWrapperConstructor
 *   }
 * }
 * ```
 *
 * and the RDF
 * ```turtle
 *   [ a <Person> ; <name> "Alice" ; ] .
 *   [ a <Person> ; <name> "Bob" ; ] .
 * ```
 *
 * this code
 * ```ts
 * for(const person of new People(dataset, factory)) {
 *   console.log(person.name)
 * }
 * ```
 *
 * will print (not necessarily in this order)
 * ```txt
 * Alice
 * Bob
 * ```
 *
 * @example Projecting from one mapping class to another
 * Given the mapping
 * ```ts
 * class Book extends TermWrapper {
 *   get author(): Person {
 *     return RequiredFrom.subjectPredicate(this, "author", TermAs.instance(Person)) // Person is an ITermWrapperConstructor
 *   }
 * }
 *
 * class Person extends TermWrapper {
 *   get name(): string {
 *     return RequiredFrom.subjectPredicate(this, "name", LiteralAs.string)
 *   }
 * }
 * ```
 *
 * and the RDF
 * ```turtle
 * <book> <author> [ <name> "Alice" ; ] .
 * ```
 *
 * this code
 * ```ts
 * const dataset =
 * const book = new Book("book", dataset, factory)
 * console.log(book.author.name)
 * ```
 *
 * will print
 * ```txt
 * Alice
 * ```
 *
 * @see
 * - {@link DatasetWrapper.instancesOf}
 * - {@link DatasetWrapper.matchObjectsOf}
 * - {@link DatasetWrapper.matchSubjectsOf}
 * - {@link DatasetWrapper.objectsOf}
 * - {@link TermAs.instance}
 * - {@link TermWrapper.from}
 */
export type ITermWrapperConstructor<T extends TermWrapper = TermWrapper> =
    (new (term: Term, dataset: DatasetCore, factory: DataFactory) => T) &
    Pick<typeof TermWrapper, "from">
