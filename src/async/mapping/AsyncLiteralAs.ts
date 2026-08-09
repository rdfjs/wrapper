import type { Literal } from "@rdfjs/types"
import { ensureDatatype, ensureIs, ensurePresent, ensureTermType } from "../../ensure.js"
import type { ILangString } from "../../type/ILangString.js"
import { RDF } from "../../vocabulary/RDF.js"
import { XSD } from "../../vocabulary/XSD.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * The asynchronous counterpart of {@link LiteralAs}: a collection of {@link IAsyncTermAsValueMapping | mappers} that convert RDF/JS literals found in asynchronous datasets to JavaScript primitives.
 *
 * @remarks
 * The mappings themselves are pure - they only read the term's lexical value, datatype and language, and never touch the dataset - and therefore return their JavaScript values synchronously. They differ from their {@link LiteralAs} counterparts only in accepting an {@link AsyncTermWrapper} rather than a {@link TermWrapper}, so they can be plugged directly into {@link IAsyncTermAsValueMapping} parameters.
 *
 * @see
 * - {@link LiteralAs}
 * - {@link Literal}
 * - [Literals in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
 */
export namespace AsyncLiteralAs {
    export function bigint(term: AsyncTermWrapper): bigint {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...integerDatatypes)

        return BigInt(term.value)
    }

    export function boolean(term: AsyncTermWrapper): boolean {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, XSD.boolean)

        return term.value === "true" || term.value === "1"
    }

    export function date(term: AsyncTermWrapper): Date {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...dateDatatypes)

        return new Date(term.value)
    }

    export function langString(term: AsyncTermWrapper): ILangString {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, RDF.langString)

        // TODO: Direction
        return {lang: term.language, string: term.value}
    }

    export function number(term: AsyncTermWrapper): number {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)
        ensureTermType(term, "Literal")
        ensureDatatype(term, ...numericDatatypes)

        if (term.value === "INF") {
            return Number.POSITIVE_INFINITY
        }

        if (term.value === "-INF") {
            return Number.NEGATIVE_INFINITY
        }

        if (term.value === "NaN") {
            return Number.NaN
        }

        return Number(term.value)
    }

    export function string(term: AsyncTermWrapper): string {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)

        return term.value
    }

    export function symbol(term: AsyncTermWrapper): symbol {
        ensurePresent(term)
        ensureIs(term, AsyncTermWrapper)

        return Symbol.for(term.value)
    }
}

const integerDatatypes: string[] = [
    XSD.integer,
    XSD.long,
    XSD.int,
    XSD.short,
    XSD.byte,
    XSD.nonNegativeInteger,
    XSD.positiveInteger,
    XSD.unsignedLong,
    XSD.unsignedInt,
    XSD.unsignedShort,
    XSD.unsignedByte,
    XSD.nonPositiveInteger,
    XSD.negativeInteger,
]

const dateDatatypes: string[] = [
    XSD.date,
    XSD.dateTime,
]

const numericDatatypes: string[] = [
    ...integerDatatypes,
    XSD.decimal,
    XSD.double,
    XSD.float,
]
