import type { Quad, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { MappingArgumentError } from "../../errors/MappingArgumentError.js"
import type { AsyncTermWrapper } from "../AsyncTermWrapper.js"
import type { IAsyncTermFromValueMapping } from "../type/IAsyncTermFromValueMapping.js"

/**
 * The asynchronous counterpart of {@link OptionalAs}.
 *
 * @see
 * - {@link OptionalAs}
 * - {@link IAsyncTermFromValueMapping}
 */
export namespace AsyncOptionalAs {
    /**
     * {@link IAsyncTermFromValueMapping | Maps} a JavaScript value to the object of a statement with the anchor term as subject and the given predicate, replacing any previous values.
     *
     * @remarks
     * The previously matching quads are materialized before any of them is deleted, so that the asynchronous dataset is never mutated while one of its (potentially lazy) match views is being consumed.
     *
     * @param anchor - The wrapped term that is the subject of the affected statements.
     * @param p - The IRI of the predicate of the affected statements.
     * @param value - The JavaScript value to map to an object term, or `undefined` to only delete previous values.
     * @param termFrom - The mapper that converts the JavaScript value to an object term.
     * @returns A promise that resolves once the underlying dataset has been updated.
     *
     * @throws {@link MappingArgumentError} If `termFrom` is `undefined`.
     *
     * @example Writing an optional property asynchronously
     * The mapping
     * ```ts
     * class Class extends AsyncTermWrapper {
     *     public setProperty(value: string | undefined): Promise<void> {
     *         return AsyncOptionalAs.object(this, "p", value, LiteralFrom.string)
     *     }
     * }
     * ```
     *
     * used in the following manner
     * ```ts
     * await new Class("s", asyncDataset, factory).setProperty("o")
     * ```
     *
     * results in the RDF
     * ```turtle
     * <s> <p> "o" .
     * ```
     */
    export async function object<T>(anchor: AsyncTermWrapper, p: string, value: T | undefined, termFrom: IAsyncTermFromValueMapping<T>): Promise<void> {
        if (termFrom === undefined) {
            throw new MappingArgumentError("termFrom")
        }

        const predicate = anchor.factory.namedNode(p)

        const existing: Quad[] = []
        for await (const q of anchor.dataset.match(anchor as Term, predicate)) {
            existing.push(q)
        }

        for (const q of existing) {
            await anchor.dataset.delete(q)
        }

        if (value === undefined) {
            return
        }

        if (!isQuadSubject(anchor as Term)) {
            return
        }

        const o = termFrom(value, anchor.factory)

        if (o === undefined) {
            return
        }

        if (!isQuadObject(o as Term)) {
            return
        }

        const q = anchor.factory.quad(anchor as Quad_Subject, predicate, o as Quad_Object)
        await anchor.dataset.add(q)
    }
}

function isQuadSubject(term: Term): term is Quad_Subject {
    return ["NamedNode", "BlankNode", "Quad", "Variable"].includes(term.termType)
}

function isQuadObject(term: Term): term is Quad_Object {
    return ["NamedNode", "Literal", "BlankNode", "Quad", "Variable"].includes(term.termType)
}
