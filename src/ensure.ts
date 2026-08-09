import type { DatasetCore, DefaultGraph, Literal, Quad, Term } from "@rdfjs/types"
import { EventfulDatasetCore } from "@jeswr/eventful-dataset"
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

    throw new NamedGraphError(quad)
}

/**
 * Returns `dataset` if it is already an {@link EventfulDatasetCore}, otherwise wraps it in one so that mutations can be observed.
 *
 * The wrapped dataset remains the single place of storage: additions and deletions performed through the returned {@link EventfulDatasetCore} write through to `dataset`, so external references to `dataset` observe all changes made through the eventful layer.
 */
export function ensureEventfulDatasetCore(dataset: DatasetCore): EventfulDatasetCore<Quad> {
    if (dataset instanceof EventfulDatasetCore) {
        return dataset
    }

    // An EventfulDatasetCore delegates storage to a dataset created by the factory it is constructed with.
    // This factory returns the dataset being wrapped on the first invocation (the storage of the eventful layer, so that mutations write through to the original dataset) and creates fresh, independent datasets on subsequent invocations (the snapshots returned by EventfulDatasetCore.match).
    let storage: DatasetCore | undefined = dataset

    return new EventfulDatasetCore<Quad>(undefined, {
        dataset(quads?: Quad[]): DatasetCore {
            if (storage !== undefined) {
                const wrapped = storage
                storage = undefined
                return wrapped
            }

            return new EventfulDatasetCore<Quad>(quads)
        },
    })
}

