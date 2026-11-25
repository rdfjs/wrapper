import type { AsyncDatasetCore } from "@jeswr/async-dataset"
import type { DataFactory, Term } from "@rdfjs/types"

/**
 * Represents the constructor signature of term mapping classes that extend {@link AsyncTermWrapper}.
 *
 * Used by this library where constructors of asynchronous mappers are accepted for implementing navigation properties that represent graph patterns on asynchronous term wrappers.
 *
 * @template T - The type of the mapping class whose instance is created.
 * @param term - The underlying term being wrapped.
 * @param dataset - The asynchronous dataset containing the wrapped term.
 * @param factory - The data factory used for creating new terms.
 * @returns An instance of the mapping class created when invoking the constructor.
 *
 * @remarks
 * Mapping classes do not need to define a constructor that matches this signature, because the base class has a publicly accessible, matching {@link AsyncTermWrapper.constructor | constructor}.
 *
 * @example Projecting from one asynchronous mapping class to another
 * Given the mapping
 * ```ts
 * class Book extends AsyncTermWrapper {
 *   get author(): Promise<Person> {
 *     return AsyncRequiredFrom.subjectPredicate(this, "author", AsyncTermAs.instance(Person)) // Person is an IAsyncTermWrapperConstructor
 *   }
 * }
 *
 * class Person extends AsyncTermWrapper {
 *   get name(): Promise<string> {
 *     return AsyncRequiredFrom.subjectPredicate(this, "name", AsyncLiteralAs.string)
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
 * const book = new Book("book", asyncDataset, factory)
 * console.log(await (await book.author).name)
 * ```
 *
 * will print
 * ```txt
 * Alice
 * ```
 *
 * @see
 * - {@link ITermWrapperConstructor}
 * - {@link AsyncTermAs.instance}
 */
export type IAsyncTermWrapperConstructor<T> = new (term: Term, dataset: AsyncDatasetCore, factory: DataFactory) => T
