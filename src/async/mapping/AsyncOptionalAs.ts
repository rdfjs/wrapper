import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"
import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Asynchronous counterpart of
 * {@link "../../mapping/OptionalAs.js"!OptionalAs}.
 *
 * Removes any existing quads matching the supplied subject + predicate
 * and, if `value` is defined, asserts a single new quad whose object is
 * derived from `value` via `termFrom`.
 */
export namespace AsyncOptionalAs {
    export async function object<T>(
        anchor: AsyncTermWrapper,
        p: string,
        value: T | undefined,
        termFrom: IAsyncTermFromValueMapping<T>,
    ): Promise<void> {
        if (termFrom === undefined) {
            throw new Error("termFrom is required")
        }

        const predicate = anchor.factory.namedNode(p)
        const matches = anchor.dataset.match(
            anchor as unknown as Quad_Subject,
            predicate,
            undefined,
            anchor.factory.defaultGraph(),
        )

        // Materialise the existing quads first; deleting while iterating
        // a live view from an async match could observe writes.
        const existing: Array<{ subject: Term; predicate: Term; object: Term; graph: Term }> = []
        for await (const q of matches) {
            existing.push(q)
        }
        for (const q of existing) {
            await anchor.dataset.delete(q as never)
        }

        if (value === undefined) {
            return
        }
        if (!isQuadSubject(anchor as unknown as Term)) {
            return
        }

        const o = termFrom(value, anchor.factory)
        if (o === undefined || !isQuadObject(o)) {
            return
        }

        const q = anchor.factory.quad(anchor as unknown as Quad_Subject, predicate, o as Quad_Object)
        await anchor.dataset.add(q)
    }
}

function isQuadSubject(term: Term): term is Quad_Subject {
    return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
}

function isQuadObject(term: Term): term is Quad_Object {
    return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
}
