import { WrapperError } from "./WrapperError.js"
import type { Term } from "@rdfjs/types"

/**
 * An error with an associated term.
 *
 * @see
 * - {@link Term}
 * - [Nodes in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#dfn-node)
 */
export class TermError extends WrapperError {
    /**
     * Creates a new instance of {@link TermError}.
     *
     * @param term - The term associated with this error.
     * @param message - A human-readable description of the error.
     * @param cause - The specific original cause of the error.
     */
    constructor(public readonly term: Term, message?: string, cause?: any) {
        super(message, cause)
    }
}
