import type { Literal, Term } from "@rdfjs/types"
import { TermTypeError } from "./errors/TermTypeError.js"
import { LiteralDatatypeError } from "./errors/LiteralDatatypeError.js"
import { RDF } from "./vocabulary/RDF.js"
import { ListRootError } from "./errors/ListRootError.js"

export function ensurePresent(object: any) {
    if (object !== undefined && object !== null) {
        return
    }

    throw new ReferenceError("Object must not be undefined or null")
}

export function ensureIs(object: any, type: Function | { [Symbol.hasInstance](): boolean }) {
    if (object instanceof type) {
        return
    }

    throw new TypeError(`Object must be a ${type}`)
}

export function ensureTermType(term: Term, type: Term["termType"]) {
    if (term.termType === type) {
        return
    }

    throw new TermTypeError(term, type)
}

export function ensureDatatype(term: Literal, ...datatypes: string[]) {
    if (datatypes.includes(term.datatype.value)) {
        return
    }

    throw new LiteralDatatypeError(term as Literal, datatypes)
}

export function ensureListRoot(term: Term) {
    if (term.termType === "NamedNode" && term.value === RDF.nil) {
        return
    }

    if (term.termType === "BlankNode") {
        return
    }

    throw new ListRootError(term)
}
