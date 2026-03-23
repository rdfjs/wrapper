import { WrapperError } from "./WrapperError.js"
import type { Term } from "@rdfjs/types"

export class TermError extends WrapperError {
    constructor(public readonly term: Term, message?: string, cause?: any) {
        super(message, cause)
    }
}
