import { TermError } from "./TermError.js"
import type { Term } from "@rdfjs/types"

/**
 * term type error
 */
export class TermTypeError extends TermError {
    constructor(term: Term, public readonly termType: Term["termType"], cause?: any) {
        super(term, `Term must have type '${termType}'`, cause)
    }
}
