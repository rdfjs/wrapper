import { WrapperError } from "./WrapperError.js"
import type { BaseQuad, Quad } from "@rdfjs/types"

export class QuadError extends WrapperError {
    constructor(public readonly quad: BaseQuad, message?: string, cause?: any) {
        super(message, cause)
    }
}
