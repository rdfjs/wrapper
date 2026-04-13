import type { Literal, Quad_Object, Quad_Subject, Term } from "@rdfjs/types"
import { TermWrapper } from "./TermWrapper.js"
import type { LanguagePreferences } from "./LanguagePreferences.js"
import { RDF } from "./vocabulary/RDF.js"
import { XSD } from "./vocabulary/XSD.js"

/**
 * A {@link Set} of strings backed by language-tagged RDF literals in a dataset, filtered by {@link LanguagePreferences}.
 *
 * @remarks
 * - Reading (iteration, `has`, `size`) returns only values matching the highest-priority language preference that has at least one match.
 * - Adding values creates literals tagged with the {@link LanguagePreferences.writeLanguage | write language}.
 * - Deleting values removes quads from the currently visible (best-matching) language.
 * - Clearing removes all `rdf:langString` quads for the predicate regardless of language.
 */
export class LanguageSet implements Set<string> {
    constructor(
        private readonly subject: TermWrapper,
        private readonly predicate: string,
        private readonly preferences: LanguagePreferences,
    ) {}

    add(value: string): this {
        const s = this.subject as Quad_Subject
        const p = this.subject.factory.namedNode(this.predicate)
        const o = this.createLangLiteral(value)
        const q = this.subject.factory.quad(s, p, o)
        this.subject.dataset.add(q)
        return this
    }

    clear(): void {
        const p = this.subject.factory.namedNode(this.predicate)
        for (const q of this.subject.dataset.match(this.subject as Term, p)) {
            if (q.object.termType === "Literal") {
                const dt = (q.object as Literal).datatype.value
                if (dt === RDF.langString || dt === XSD.string) {
                    this.subject.dataset.delete(q)
                }
            }
        }
    }

    delete(value: string): boolean {
        const p = this.subject.factory.namedNode(this.predicate)

        for (const literal of this.bestMatchLiterals) {
            if (literal.value === value) {
                const q = this.subject.factory.quad(
                    this.subject as Quad_Subject,
                    p,
                    literal as Quad_Object
                )
                this.subject.dataset.delete(q)
                return true
            }
        }

        return false
    }

    forEach(cb: (item: string, index: string, set: Set<string>) => void, thisArg?: any): void {
        for (const item of this) {
            cb.call(thisArg, item, item, this)
        }
    }

    has(value: string): boolean {
        for (const literal of this.bestMatchLiterals) {
            if (literal.value === value) {
                return true
            }
        }
        return false
    }

    get size(): number {
        return this.bestMatchLiterals.length
    }

    [Symbol.iterator](): SetIterator<string> {
        return this.values()
    }

    * entries(): SetIterator<[string, string]> {
        for (const v of this) {
            yield [v, v]
        }
    }

    keys(): SetIterator<string> {
        return this.values()
    }

    * values(): SetIterator<string> {
        for (const literal of this.bestMatchLiterals) {
            yield literal.value
        }
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    private get bestMatchLiterals(): Literal[] {
        return this.preferences.filterBest(this.allLangStringQuads)
    }

    private get allLangStringQuads() {
        const p = this.subject.factory.namedNode(this.predicate)
        return this.subject.dataset.match(this.subject as Term, p)
    }

    private createLangLiteral(value: string): Quad_Object {
        const language = this.preferences.writeLanguage
        if (language === "") {
            return this.subject.factory.literal(value) as Quad_Object
        }
        return this.subject.factory.literal(value, language) as Quad_Object
    }
}
