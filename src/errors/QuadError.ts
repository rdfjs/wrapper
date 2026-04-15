import { WrapperError } from "./WrapperError.js"
import type { Quad } from "@rdfjs/types"

export class QuadError extends WrapperError {
    constructor(public readonly quad: Quad, message?: string, cause?: any) {
        super(message, cause)
    }
}
