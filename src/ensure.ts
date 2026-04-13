import type { DefaultGraph, Literal, Quad, Term } from "@rdfjs/types"
import { TermTypeError } from "./errors/TermTypeError.js"
import { LiteralDatatypeError } from "./errors/LiteralDatatypeError.js"
import type { IRdfJsTerm } from "./type/IRdfJsTerm.js"
import { RDF } from "./vocabulary/RDF.js"
import { ListRootError } from "./errors/ListRootError.js"
import { NamedGraphError } from "./errors/NamedGraphError.js"

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

export function ensureTermType(term: { termType: Term["termType"] }, type: Term["termType"]) {
    if (term.termType === type) {
        return
    }

    throw new TermTypeError(term as Term, type)
}

export function ensureDatatype(term: IRdfJsTerm, ...datatypes: string[]) {
    if (datatypes.includes(term.datatype.value)) {
        return
    }

    throw new LiteralDatatypeError(term as Literal, datatypes)
}

export function ensureListRoot(term: IRdfJsTerm) {
    if (term.termType === "NamedNode" && term.value === RDF.nil) {
        return
    }

    if (term.termType === "BlankNode") {
        return
    }

    throw new ListRootError(term as Term)
}

export function ensureDefaultGraph(quad: Quad): asserts quad is Quad & { graph: DefaultGraph } {
    if (quad.graph.termType === "DefaultGraph") {
        return
    }

    throw new NamedGraphError()
}

