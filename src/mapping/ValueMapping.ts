import type { Term } from "@rdfjs/types"
import type { ILangString } from "../type/ILangString.js"
import type { TermWrapper } from "../TermWrapper.js"
import { ValueMappingError } from "../ValueMappingError.js"

/*
 * Read from the RDF dataset
 * Transform RDF Terms to JavaScript primitive types
*/
export namespace ValueMapping {
    export function blankNodeToString(termWrapper: TermWrapper): string {
        if (termWrapper.termType !== "BlankNode") {
            throw new ValueMappingError("BlankNode", termWrapper.termType)
        }
        return iriOrBlankNodeToString(termWrapper)
    }

    export function literalToDate(termWrapper: TermWrapper): Date {
        if (termWrapper.termType !== "Literal") {
            throw new ValueMappingError("Literal", termWrapper.termType)
        }
        return new Date(termWrapper.value)
    }

    export function literalToLangString(termWrapper: TermWrapper): ILangString {
        if (termWrapper.termType !== "Literal") {
            throw new ValueMappingError("Literal", termWrapper.termType)
        }
        return { direction: termWrapper.direction ?? '', lang: termWrapper.language, string: termWrapper.value }
    }

    export function literalToNumber(termWrapper: TermWrapper): number {
        if (termWrapper.termType !== "Literal") {
            throw new ValueMappingError("Literal", termWrapper.termType)
        }
        return Number(termWrapper.value)
    }

    export function literalToBoolean(termWrapper: TermWrapper): boolean {
        if (termWrapper.termType !== "Literal") {
            throw new ValueMappingError("Literal", termWrapper.termType)
        }
        return termWrapper.value === "true" || termWrapper.value === "1"
    }

    export function literalToString(termWrapper: TermWrapper): string {
        if (termWrapper.termType !== "Literal") {
            throw new ValueMappingError("Literal", termWrapper.termType)
        }
        return termWrapper.value
    }

    export function iriToString(termWrapper: TermWrapper): string {
        if (termWrapper.termType !== "NamedNode") {
            throw new ValueMappingError("NamedNode", termWrapper.termType)
        }
        return iriOrBlankNodeToString(termWrapper)
    }

    export function iriOrBlankNodeToString(termWrapper: TermWrapper): string {
        return termWrapper.value
    }

    export function asIs(termWrapper: TermWrapper): Term {
        return termWrapper as Term
    }
}
