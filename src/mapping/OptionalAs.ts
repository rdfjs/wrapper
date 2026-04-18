import { TermWrapper } from "../TermWrapper.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { LanguagePreferences } from "../LanguagePreferences.js"
import { isStringLiteralQuad } from "../isStringLiteralQuad.js"

export namespace OptionalAs {
    export function object<T>(anchor: TermWrapper, p: string, value: T | undefined, termFrom: ITermFromValueMapping<T>) {
        if (termFrom === undefined) {
            throw new Error
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

    /**
     * Writes an optional string value as a string literal, using the write language from the given preferences when present.
     *
     * @remarks
     * When `value` is defined, only quads matching the {@link LanguagePreferences.writeLanguage | write language} are
     * replaced, preserving other translations. Matching literals with datatype `rdf:langString` or `xsd:string` are
     * considered replaceable for that write language. When `value` is `undefined`, all string literals for the
     * predicate are removed, including both `rdf:langString` and `xsd:string` literals.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param value - The string value to write, or `undefined` to remove both language-tagged and plain string literals for the predicate.
     * @param preferences - The language preferences to use for the write language.
     */
    export function objectByLanguage(anchor: TermWrapper, p: string, value: string | undefined, preferences: LanguagePreferences) {
        const predicate = anchor.factory.namedNode(p)
        const writeLanguage = preferences.writeLanguage

        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            if (!isStringLiteralQuad(q)) continue
            if (value !== undefined && !preferences.matchesPreference(q.object.language, writeLanguage || "@none")) continue
            anchor.dataset.delete(q)
        }

        if (value === undefined) {
            return
        }

        if (!isQuadSubject(anchor as Term)) {
            return
        }

        const o = writeLanguage
            ? anchor.factory.literal(value, writeLanguage)
            : anchor.factory.literal(value)

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
