import { TermWrapper } from "../TermWrapper.js"
import { WrappingMap } from "../WrappingMap.js"
import { LiteralAs } from "./LiteralAs.js"
import { LiteralFrom } from "./LiteralFrom.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"

export namespace Mapping {
    /**
     * Creates a {@link Map} backed by quads of `anchor` for predicate `p`, where each matching object
     * literal is projected to a `[key, value]` tuple by `termAs`, and writes are projected back to a
     * literal by `termFrom`.
     *
     * @remarks
     * The returned map is backed by the dataset: reads, writes, and deletions operate directly on the
     * underlying quads. The shape of the keys and values is determined entirely by the caller-supplied
     * tuple mappings.
     *
     * For a language-tagged string dictionary (`Map<languageTag, value>`), prefer the convenience
     * helper {@link languageDictionary}.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @param termAs - Maps an object literal to a `[key, value]` tuple.
     * @param termFrom - Maps a `[key, value]` tuple back to a literal.
     * @returns A live, dataset-backed `Map` of `[key, value]` entries for `p` on `anchor`.
     */
    export function dictionary<TKey, TValue>(anchor: TermWrapper, p: string, termAs: ITermAsValueMapping<[TKey, TValue]>, termFrom: ITermFromValueMapping<[TKey, TValue]>): Map<TKey, TValue> {
        if (termAs === undefined) {
            throw new Error // TODO: Describe
        }

        if (termFrom === undefined) {
            throw new Error // TODO: Describe
        }

        return new WrappingMap(anchor, p, termAs, termFrom)
    }

    /**
     * Creates a `Map<string, string>` backed by `rdf:langString` quads of `anchor` for predicate `p`,
     * keyed by language tag.
     *
     * @remarks
     * This is a convenience wrapper around {@link dictionary} that hard-wires
     * {@link LiteralAs.langTuple} and {@link LiteralFrom.langTuple} as the tuple mappings, so only
     * `rdf:langString` literals are considered. Plain `xsd:string` literals (without a language tag)
     * are not included.
     *
     * For a snapshot view that also includes `xsd:string` literals (grouped under `"@none"`), see
     * `languagesOf`.
     *
     * @param anchor - The subject term wrapper.
     * @param p - The predicate IRI.
     * @returns A live, dataset-backed `Map` from language tag to string value.
     */
    export function languageDictionary(anchor: TermWrapper, p: string): Map<string, string> {
        return dictionary(anchor, p, LiteralAs.langTuple, LiteralFrom.langTuple)
    }
}
