import type { DataFactory, Term } from "@rdfjs/types"
import type { IAnyTerm } from "../type/IAnyTerm.js"

export namespace TermFrom {
    export function instance(value: IAnyTerm, factory: DataFactory): Term {
        return itself(value as Term, factory)
    }

    export function itself(value: Term, _: DataFactory): Term {
        return value
    }
}
