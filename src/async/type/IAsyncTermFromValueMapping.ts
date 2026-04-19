import type { DataFactory, Term } from "@rdfjs/types"
import type { Triple } from "../../type/ITriple.js"

/**
 * Maps a JavaScript value to an RDF/JS {@link Term}. Term creation is
 * pure and never needs to touch the dataset, so this signature is
 * synchronous - identical to its sync counterpart, but re-exported here
 * for symmetry with {@link IAsyncTermAsValueMapping}.
 */
export type IAsyncTermFromValueMapping<T> = (
    value: T,
    factory: DataFactory<Triple, Triple>,
) => Term
