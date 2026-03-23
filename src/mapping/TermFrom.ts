import type { DataFactory, Term } from "@rdfjs/types"
import { XSD } from "../vocabulary/XSD.js"
import type { IAnyTerm } from "../type/IAnyTerm.js"
import type { ILangString } from "../type/ILangString.js"

export namespace TermFrom {
    export function anyUriString(value: string, factory: DataFactory): Term {
        return factory.literal(value, factory.namedNode(XSD.anyUri))
    }

    export function anyUriUrl(value: URL, factory: DataFactory): Term {
        return anyUriString(value.toString(), factory)
    }

    export function namedString(value: string, factory: DataFactory): Term {
        return factory.namedNode(value)
    }

    export function namedUrl(value: URL, factory: DataFactory): Term {
        return namedString(value.toString(), factory)
    }

    export function base64(value: Uint8Array, factory: DataFactory): Term {
        // TODO: Sort typing
        return factory.literal((value as any).toBase64(), factory.namedNode(XSD.base64Binary))
    }

    export function blankNodeLabel(value: string | undefined, factory: DataFactory): Term {
        return factory.blankNode(value)
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

    export function instance(value: IAnyTerm, factory: DataFactory): Term {
        return itself(value as Term, factory)
    }

    export function itself(value: Term, __: DataFactory): Term {
        return value
    }

    export function langString(value: ILangString, factory: DataFactory): Term {
        // TODO: Direction
        return factory.literal(value.string, {language: value.lang})
    }

    export function string(value: string, factory: DataFactory): Term {
        return factory.literal(value)
    }
}
