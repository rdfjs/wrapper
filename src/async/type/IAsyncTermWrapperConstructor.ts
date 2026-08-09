import type { AsyncDatasetCore, DataFactory, Term } from "@rdfjs/types"

/**
 * Represents the constructor signature of mapping classes that wrap terms of an asynchronous dataset.
 *
 * Used by this library where constructors of mappers are accepted for implementing navigation properties that represent graph patterns on asynchronous dataset wrappers.
 *
 * @template T - The type of the mapping class whose instance is created.
 * @param term - The underlying term being wrapped.
 * @param dataset - The asynchronous dataset containing the wrapped term.
 * @param factory - The data factory used for creating new terms.
 * @returns An instance of the mapping class created when invoking the constructor.
 *
 * @remarks
 * This is the asynchronous counterpart of {@link ITermWrapperConstructor}: the dataset passed to the constructor is an {@link AsyncDatasetCore}, so any traversal the mapping class performs over it must be awaited. Because reads are asynchronous, navigation properties on such mapping classes typically return a `Promise` or an `AsyncIterable` instead of a plain value.
 *
 * @example Projecting from an asynchronous dataset to a mapping class
 * Given the mapping
 * ```ts
 * class Person {
 *     public constructor(
 *         private readonly term: Term,
 *         private readonly dataset: AsyncDatasetCore,
 *         private readonly factory: DataFactory,
 *     ) {
 *     }
 *
 *     public get name(): Promise<string | undefined> {
 *         return (async () => {
 *             for await (const quad of this.dataset.match(this.term, this.factory.namedNode("name"))) {
 *                 return quad.object.value
 *             }
 *             return undefined
 *         })()
 *     }
 * }
 *
 * class People extends AsyncDatasetWrapper {
 *     public get all(): AsyncIterable<Person> {
 *         return this.instancesOf("Person", Person) // 2nd param is an IAsyncTermWrapperConstructor
 *     }
 * }
 * ```
 *
 * and the RDF
 * ```turtle
 * [ a <Person> ; <name> "Alice" ; ] .
 * [ a <Person> ; <name> "Bob" ; ] .
 * ```
 *
 * this code
 * ```ts
 * for await (const person of new People(dataset, factory).all) {
 *     console.log(await person.name)
 * }
 * ```
 *
 * will print (not necessarily in this order)
 * ```txt
 * Alice
 * Bob
 * ```
 *
 * @see
 * - {@link AsyncDatasetWrapper.instancesOf}
 * - {@link AsyncDatasetWrapper.matchObjectsOf}
 * - {@link AsyncDatasetWrapper.matchSubjectsOf}
 * - {@link AsyncDatasetWrapper.objectsOf}
 * - {@link AsyncDatasetWrapper.subjectsOf}
 * - {@link ITermWrapperConstructor}
 */
export type IAsyncTermWrapperConstructor<T> = new (term: Term, dataset: AsyncDatasetCore, factory: DataFactory) => T
