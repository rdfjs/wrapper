import type { BaseQuad } from "@rdfjs/types"
import { QuadError } from "./QuadError.js"

/**
 * Thrown when a named graph is used on a dataset view that only supports the default graph.
 *
 * @see {@link DatasetWrapper.scoped}
 * @see {@link GraphScopedDataset}
 */
export class NamedGraphError extends QuadError {
    constructor(quad: BaseQuad, cause?: any) {
        super(quad, `Graph must be default (empty) but was ${quad.graph.value}`, cause)
    }
}
