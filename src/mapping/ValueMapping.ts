import type { Term } from "@rdfjs/types"
import type { ILangString } from "../type/ILangString.js"
import type { TermWrapper } from "../TermWrapper.js"

/*
 * Read from the RDF dataset
 * Transform RDF Terms to JavaScript primitive types
*/
export namespace ValueMapping {
    export function blankNodeToString(termWrapper: TermWrapper): string {
        // TODO: Throw typed error
        if (termWrapper.termType != "BlankNode") {
            throw Error(`Value mapping expected blank node but got ${termWrapper.termType}`)
        }
        return iriOrBlankNodeToString(termWrapper)
    }

    export function literalToDate(termWrapper: TermWrapper): Date {
        // TODO: Check term type
        return new Date(termWrapper.value)
    }

    // TODO: Lang string dictionary value mapping
    export function literalToLangString(termWrapper: TermWrapper): ILangString {
        // TODO: Check term type
        return { lang: termWrapper.language, string: termWrapper.value }
    }

    export function literalToNumber(termWrapper: TermWrapper): number {
        // TODO: Check term type
        return Number(termWrapper.value)
    }

    export function literalToBoolean(termWrapper: TermWrapper): boolean {
        // TODO: Check term type
        return termWrapper.value === "true" || termWrapper.value === "1"
    }

    export function literalToString(termWrapper: TermWrapper): string {
        // TODO: Check term type
        return termWrapper.value
    }

    export function iriToString(termWrapper: TermWrapper): string {
        // TODO: Check term type
        return iriOrBlankNodeToString(termWrapper)
    }

    export function iriOrBlankNodeToString(termWrapper: TermWrapper): string {
        return termWrapper.value
    }

    export function asIs(termWrapper: TermWrapper): Term {
        return termWrapper as Term
    }
}
