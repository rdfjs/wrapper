import { TermWrapper } from "../TermWrapper.js"
import type { Term } from "@rdfjs/types"
import { TermTypeError } from "../errors/TermTypeError.js"

export namespace NamedNodeAs {
    export function string(term: TermWrapper): string {
        ensurePresent(term)
        ensureType(term)
        ensureNamedNode(term)

        return term.value
    }
}

function ensurePresent(term: any) {
    if (term === undefined || term === null) {
        throw new ReferenceError("Term cannot be null or undefined")
    }
}

function ensureType(term: any) {
    if (!(term instanceof TermWrapper)) {
        throw new TypeError("Term must be a TermWrapper")
    }
}

function ensureNamedNode(term: TermWrapper) {
    if (term.termType !== "NamedNode") {
        throw new TermTypeError(term as Term, "NamedNode")
    }
}
