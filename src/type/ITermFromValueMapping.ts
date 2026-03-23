import type { DataFactory, Term } from "@rdfjs/types"

export interface ITermFromValueMapping<T> {
    (value: T, factory: DataFactory): Term
}
