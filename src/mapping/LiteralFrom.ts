import type { DataFactory, Term } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import type { ILangString } from "../type/ILangString.js"

export namespace LiteralFrom {
    export function anyUriString(value: string, factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(XSD.anyUri))
    }

    export function anyUriUrl(value: URL, factory: DataFactory): Term {
        return anyUriString(value.toString(), factory)
    }

    export function base64(value: Uint8Array, factory: DataFactory): Term {
        // TODO: Sort typing
        return factory.literal((value as any).toBase64(), factory.namedNode(XSD.base64Binary))
    }

    export function boolean(value: boolean, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.boolean))
    }

    export function date(value: Date, factory: DataFactory): Term {
        return factory.literal(value.toISOString(), factory.namedNode(XSD.date))
    }

    export function dateTime(value: Date, factory: DataFactory): Term {
        return factory.literal(value.toISOString(), factory.namedNode(XSD.dateTime))
    }

    export function double(value: number, factory: DataFactory): Term {
        return factory.literal(value.toString(), factory.namedNode(XSD.double))
    }

    export function hex(value: Uint8Array, factory: DataFactory): Term {
        // TODO: Sort typing
        return factory.literal((value as any).toHex(), factory.namedNode(XSD.hexBinary))
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
