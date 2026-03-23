import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"

export interface ITermFromValueMapping<T> {
    (value: T, dataset: DatasetCore, factory: DataFactory): Term
}
