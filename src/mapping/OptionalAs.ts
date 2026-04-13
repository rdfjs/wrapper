import { TermWrapper } from "../TermWrapper.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { Literal, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import type { LanguagePreferences } from "../LanguagePreferences.js"
import { RDF } from "../vocabulary/RDF.js"
import { XSD } from "../vocabulary/XSD.js"

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
     * Writes an optional string value as a language-tagged literal, using the write language from the given preferences.
     *
     * @remarks
     * When `value` is defined, only quads matching the {@link LanguagePreferences.writeLanguage | write language} are
     * replaced, preserving other translations. When `value` is `undefined`, all `rdf:langString` quads for the
     * predicate are removed.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param value - The string value to write, or `undefined` to remove.
     * @param preferences - The language preferences to use for the write language.
     */
    export function objectByLanguage(anchor: TermWrapper, p: string, value: string | undefined, preferences: LanguagePreferences) {
        const predicate = anchor.factory.namedNode(p)
        const writeLanguage = preferences.writeLanguage

        if (value === undefined) {
            // Remove all string/langString quads for this predicate
            for (const q of anchor.dataset.match(anchor as Term, predicate)) {
                if (q.object.termType === "Literal") {
                    const dt = (q.object as Literal).datatype.value
                    if (dt === RDF.langString || dt === XSD.string) {
                        anchor.dataset.delete(q)
                    }
                }
            }
            return
        }

        if (!isQuadSubject(anchor as Term)) {
            return
        }

        // Remove only quads matching the write language
        for (const q of anchor.dataset.match(anchor as Term, predicate)) {
            if (q.object.termType === "Literal") {
                const literal = q.object as Literal
                const dt = literal.datatype.value
                if ((dt === RDF.langString || dt === XSD.string) && preferences.matchesPreference(literal.language, writeLanguage || "@none")) {
                    anchor.dataset.delete(q)
                }
            }
        }

        const o = writeLanguage
            ? anchor.factory.literal(value, writeLanguage)
            : anchor.factory.literal(value)

        if (!isQuadObject(o as Term)) {
            return
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
