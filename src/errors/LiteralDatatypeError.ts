import { TermError } from "./TermError.js"
import type { Term } from "@rdfjs/types"

export class LiteralDatatypeError extends TermError {
    constructor(term: Term, public readonly datatypes: Iterable<string>, cause?: any) {
        super(term, `Literal datatype must be one of ${[...datatypes].map(d => `<${d}>`).join(", ")}`, cause)
    }
}
