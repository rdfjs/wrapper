import type { BaseQuad, Quad } from "@rdfjs/types"

/**
 * The asynchronous counterpart of the RDF/JS
 * [`DatasetCore`](https://rdf.js.org/dataset-spec/#datasetcore-interface)
 * interface.
 *
 * Every operation that touches the underlying storage returns a
 * {@link Promise}, with the single deliberate exception of {@link match},
 * which immediately returns another {@link AsyncDatasetCore} that
 * represents the matched view. This mirrors the synchronous interface,
 * where `match` returns a dataset rather than the matched quads
 * themselves; the matched view performs its actual work lazily on
 * iteration / {@link size} / {@link has}.
 *
 * Iteration is exposed via {@link Symbol.asyncIterator}; there is no
 * synchronous `Symbol.iterator`. Consumers should use `for await ... of`.
 *
 * @example Reading and iterating
 * ```ts
 * console.log(await dataset.size)
 * for await (const quad of dataset) {
 *   console.log(quad.subject.value)
 * }
 *
 * // match is sync; iteration is async
 * for await (const quad of dataset.match(subject, predicate)) {
 *   console.log(quad.object.value)
 * }
 * ```
 *
 * @typeParam OutQuad - The shape of quads yielded by iteration and
 *                     returned by reads.
 * @typeParam InQuad  - The shape of quads accepted by writes.
 */
export interface AsyncDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> {
    /** A {@link Promise} resolving to the number of quads currently in this dataset. */
    readonly size: Promise<number>

    /** Adds `quad` to the dataset. */
    add(quad: InQuad): Promise<this>

    /** Removes `quad` from the dataset. */
    delete(quad: InQuad): Promise<this>

    /** Resolves to `true` if `quad` is present in the dataset. */
    has(quad: InQuad): Promise<boolean>

    /**
     * Returns an {@link AsyncDatasetCore} view of the quads matching the
     * supplied pattern. This call is itself synchronous; the returned
     * dataset performs the actual matching lazily on iteration / size /
     * has.
     */
    match(
        subject?: OutQuad["subject"] | null,
        predicate?: OutQuad["predicate"] | null,
        object?: OutQuad["object"] | null,
        graph?: OutQuad["graph"] | null,
    ): AsyncDatasetCore<OutQuad, InQuad>

    /** Yields the quads of this dataset asynchronously. */
    [Symbol.asyncIterator](): AsyncIterator<OutQuad>
}

/**
 * The asynchronous counterpart of the RDF/JS
 * [`DatasetCoreFactory`](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface)
 * interface.
 *
 * Accepts an `AsyncIterable` or `Iterable` of seed quads, in addition to
 * an array as required by the standard interface, so any source -
 * including another {@link AsyncDatasetCore} - can be used to seed a new
 * dataset.
 */
export interface AsyncDatasetCoreFactory<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad,
    D extends AsyncDatasetCore<OutQuad, InQuad> = AsyncDatasetCore<OutQuad, InQuad>,
> {
    dataset(quads?: AsyncIterable<InQuad> | Iterable<InQuad>): Promise<D>
}

