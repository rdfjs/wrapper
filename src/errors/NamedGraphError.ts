import { BaseTriple } from "../ProjectedDataset.js"
import { QuadError } from "./QuadError.js"
import type { Quad } from "@rdfjs/types"

/**
 * Thrown when a named graph is used on a dataset view that only supports the default graph.
 *
 * @see {@link namedGraph}
 */
export class NamedGraphError extends QuadError {
    constructor(quad: BaseTriple, cause?: any) {
        super(quad, `Graph must be default (empty) but was ${quad.value}`, cause)
    }
}
