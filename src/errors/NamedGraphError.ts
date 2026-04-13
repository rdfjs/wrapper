import { WrapperError } from "./WrapperError.js"

/**
 * Thrown when a named graph is used on a dataset view that only supports the default graph.
 *
 * @see {@link namedGraph}
 */
export class NamedGraphError extends WrapperError {
    constructor(message?: string, cause?: any) {
        super(message ?? "Named graphs are not supported on this dataset", cause)
    }
}
