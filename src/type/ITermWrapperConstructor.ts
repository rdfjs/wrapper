import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"
import { TermWrapper } from "../TermWrapper.js"

/**
 * Represents the constructor signature of term mapping classes that extend {@link TermWrapper}.
 *
 * Used by this library where constructors of mappers are accepted for implementing navigation properties that represent graph patterns on dataset and term wrappers.
 *
 * @template T - The type of the mapping class whose instance is created.
 * @param term - The underlying term being wrapped.
 * @param dataset - The dataset containing the wrapped term.
 * @param factory - The data factory used for creating new terms.
 * @returns An instance of the mapping class created when invoking the constructor.
 *
 * @remarks
 * Mapping classes do not need to define a constructor that matches this signature, because the base class has a publicly accessible, matching {@link TermWrapper.constructor | constructor}.
 *
 * @example Projecting from a dataset to a mapping class
 * Given the mapping
 * ```ts
 * class Person extends TermWrapper {
 *   get name(): string {
 *     return RequiredFrom.subjectPredicate(this.node, "name", LiteralAs.string)
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
 *     return RequiredFrom.subjectPredicate(this.node, "author", TermAs.instance(Person)) // Person is an ITermWrapperConstructor
 *   }
 * }
 *
 * class Person extends TermWrapper {
 *   get name(): string {
 *     return RequiredFrom.subjectPredicate(this.node, "name", LiteralAs.string)
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
 */
export type ITermWrapperConstructor<T extends TermWrapper = TermWrapper> =
    (new (term: Term, dataset: DatasetCore, factory: DataFactory) => T) &
    Pick<typeof TermWrapper, 'from'>
