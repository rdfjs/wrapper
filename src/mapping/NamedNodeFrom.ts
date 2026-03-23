import type { DataFactory, Term } from "@rdfjs/types"

export namespace NamedNodeFrom {
    export function string(value: string, factory: DataFactory): Term {
        return factory.namedNode(value)
    }

    export function url(value: URL, factory: DataFactory): Term {
        return string(value.toString(), factory)
    }
}
