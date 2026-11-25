import { TermWrapper } from "../TermWrapper.js"
import { MappingArgumentError } from "../errors/MappingArgumentError.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"

export namespace OptionalAs {
    /**
     * {@link ITermFromValueMapping | Maps} a JavaScript value to the object of a statement with the anchor term as subject and the given predicate, replacing any previous values.
     *
     * @param anchor - The wrapped term that is the subject of the affected statements.
     * @param p - The IRI of the predicate of the affected statements.
     * @param value - The JavaScript value to map to an object term, or `undefined` to only delete previous values.
     * @param termFrom - The mapper that converts the JavaScript value to an object term.
     *
     * @throws {@link MappingArgumentError} If `termFrom` is `undefined`.
     */
    export function object<T>(anchor: TermWrapper, p: string, value: T | undefined, termFrom: ITermFromValueMapping<T>) {
        if (termFrom === undefined) {
            throw new MappingArgumentError("termFrom")
        }

        const predicate = anchor.factory.namedNode(p)

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            anchor.dataset.delete(q)
        }

        // TODO: TermMapping undefined: Return after deleting quads if undefined
        if (value === undefined) {
            return
        }

        // TODO: Do we really need to test if anchor is a Quad Subject here?
        // @Samu I imagine this is tested at instantiation time in the constructor if at all
        if (!isQuadSubject(anchor as Term)) {
            return // TODO: throw error?
        }

        // TODO: TermMapping undefined: the term mapping is not invoked if undefined
        const o = termFrom(value, anchor.factory)

        if (o === undefined) {
            return // TODO: throw error?
        }

        if (!isQuadObject(o as Term)) {
            return // TODO: throw error?
        }

        const q = anchor.factory.quad(anchor as Quad_Subject, predicate, o as Quad_Object)
        anchor.dataset.add(q)
    }
}

function isQuadSubject(term: Term): term is Quad_Subject {
    return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
}

function isQuadObject(term: Term): term is Quad_Object {
    return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
}
