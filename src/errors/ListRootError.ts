import { TermError } from "./TermError.js"
import type { Term } from "@rdfjs/types"

export class ListRootError extends TermError {
    constructor(term: Term, cause?: any) {
        super(term, `List root must be rdf:nil or a BlankNode but was ${term.value}`, cause)
    }
}
