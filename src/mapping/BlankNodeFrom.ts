import type { DataFactory, Term } from "@rdfjs/types"

export namespace BlankNodeFrom {
    export function string(value: string | undefined, factory: DataFactory): Term {
        return factory.blankNode(value)
    }
}
