import type { BaseQuad, DataFactory, Literal, NamedNode, Term } from "@rdfjs/types"
import type { IRdfJsTerm } from "../type/IRdfJsTerm.js"
import type { AsyncDefaultDatasetCore } from "./AsyncNotifyingDatasetCore.js"
import type { Triple } from "../type/ITriple.js"

/**
 * Asynchronous counterpart of {@link "../TermWrapper.js"!TermWrapper}.
 *
 * Exposes the same RDF/JS {@link Term} surface but is bound to an
 * {@link AsyncDefaultDatasetCore}, so any traversal that needs to read or
 * write the underlying dataset returns a {@link Promise}.
 *
 * The term identity members ({@link termType}, {@link value},
 * {@link equals}, etc.) are intentionally synchronous because they only
 * inspect the wrapped term and do not touch the dataset.
 *
 * @example Defining an async wrapper
 * Property getters return promises (for required / optional reads) or
 * an {@link "./AsyncWrappingSet.js"!AsyncWrappingSet} (for set
 * mappings). Because JavaScript property setters cannot be `async`,
 * write-mappings are exposed as `setX(value)` methods that return a
 * {@link Promise}:
 * ```ts
 * class AsyncPerson extends AsyncTermWrapper {
 *   get name(): Promise<string | undefined> {
 *     return AsyncOptionalFrom.subjectPredicate(this, "https://example.org/name", AsyncLiteralAs.string)
 *   }
 *   setName(value: string | undefined): Promise<void> {
 *     return AsyncOptionalAs.object(this, "https://example.org/name", value, LiteralFrom.string)
 *   }
 * }
 *
 * const alice = new AsyncPerson("https://example.org/alice", asyncDataset, factory)
 * console.log(await alice.name) // "Alice"
 * await alice.setName("Alicia")
 * ```
 */
export class AsyncTermWrapper implements IRdfJsTerm {
    private readonly original: Term
    private readonly _dataset: AsyncDefaultDatasetCore<Triple>
    private readonly _factory: DataFactory<Triple, Triple>

    public constructor(
        term: string | Term,
        dataset: AsyncDefaultDatasetCore<Triple>,
        factory: DataFactory<Triple, Triple>,
    ) {
        this.original = typeof term === "string" ? factory.namedNode(term) : term
        this._dataset = dataset
        this._factory = factory
    }

    /** The dataset this term lives in. All reads/writes through this wrapper go via this dataset. */
    get dataset(): AsyncDefaultDatasetCore<Triple> {
        return this._dataset
    }

    /** The factory for creating additional terms and quads. */
    get factory(): DataFactory<Triple, Triple> {
        return this._factory
    }

    get [Symbol.toStringTag](): string {
        return this.constructor.name
    }

    //#region Term

    get termType(): Term["termType"] {
        return this.original.termType
    }

    get value(): string {
        return this.original.value
    }

    equals(other: Term | null | undefined): boolean {
        return this.original.equals(other)
    }

    //#region Literal

    get language(): string {
        return (this.original as Literal).language
    }

    get direction(): Literal["direction"] {
        return (this.original as Literal).direction
    }

    get datatype(): NamedNode {
        return (this.original as Literal).datatype
    }

    //#endregion

    //#region Quad

    get subject(): Term {
        return (this.original as BaseQuad).subject
    }

    get predicate(): Term {
        return (this.original as BaseQuad).predicate
    }

    get object(): Term {
        return (this.original as BaseQuad).object
    }

    get graph(): Term {
        return (this.original as BaseQuad).graph
    }

    //#endregion

    //#endregion
}
