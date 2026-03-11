import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"
import { AnyTerm } from "./AnyTerm.js"

export abstract class AnyTermWithContext extends AnyTerm {
    public constructor(term: string, dataset: DatasetCore, factory: DataFactory);
    public constructor(term: Term, dataset: DatasetCore, factory: DataFactory);
    public constructor(term: string | Term, public readonly dataset: DatasetCore, public readonly factory: DataFactory) {
        super(typeof term === "string" ? factory.namedNode(term) : term)
    }
}
