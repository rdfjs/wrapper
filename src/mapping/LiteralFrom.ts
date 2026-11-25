import type { DataFactory, Literal, Term } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import type { ILangString } from "../type/ILangString.js"
import { formatBase64Binary, formatHexBinary } from "../xsd/binary.js"
import { formatBoolean } from "../xsd/boolean.js"
import { formatDate, formatDateTime } from "../xsd/dateTime.js"
import { formatDouble } from "../xsd/float.js"
import { formatInteger } from "../xsd/integer.js"

/**
 * A collection of {@link ITermFromValueMapping | mappers} that create RDF/JS literals from JavaScript primitives.
 *
 * @see
 * - {@link Literal}
 * - [Literals in RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/#section-Graph-Literal)
 */
export namespace LiteralFrom {
    export function anyUriString(value: string, factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(XSD.anyURI))
    }

    export function anyUriUrl(value: URL, factory: DataFactory): Term {
        return anyUriString(value.toString(), factory)
    }

    export function base64(value: Uint8Array, factory: DataFactory): Term {
        return factory.literal(formatBase64Binary(value), factory.namedNode(XSD.base64Binary))
    }

    export function boolean(value: boolean, factory: DataFactory): Term {
        return factory.literal(formatBoolean(value), factory.namedNode(XSD.boolean))
    }

    export function date(value: Date, factory: DataFactory): Term {
        return factory.literal(formatDate(value), factory.namedNode(XSD.date))
    }

    export function dateTime(value: Date, factory: DataFactory): Term {
        return factory.literal(formatDateTime(value), factory.namedNode(XSD.dateTime))
    }

    export function double(value: number, factory: DataFactory): Term {
        return factory.literal(formatDouble(value), factory.namedNode(XSD.double))
    }

    export function integer(value: number | bigint, factory: DataFactory): Term {
        return factory.literal(formatInteger(value), factory.namedNode(XSD.integer))
    }

    export function hex(value: Uint8Array, factory: DataFactory): Term {
        return factory.literal(formatHexBinary(value), factory.namedNode(XSD.hexBinary))
    }

    export function langString(value: ILangString, factory: DataFactory): Term {
        // TODO: Direction
        return factory.literal(value.string, {language: value.lang})
    }

    export function string(value: string, factory: DataFactory): Term {
        return factory.literal(value)
    }

    export function langTuple([key, value]: [string, string], factory: DataFactory): Term {
        return factory.literal(value, key)
    }

    export function datatypeTuple([key, value]: [string, string], factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(key))
    }
}
