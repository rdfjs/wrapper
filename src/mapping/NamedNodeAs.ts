import { TermWrapper } from "../TermWrapper.js"
import { ensureIs, ensurePresent, ensureTermType } from "../ensure.js"

export namespace NamedNodeAs {
    export function string(term: TermWrapper): string {
        ensurePresent(term)
        ensureIs(term, TermWrapper)
        ensureTermType(term, "NamedNode")

        return term.value
    }
}
