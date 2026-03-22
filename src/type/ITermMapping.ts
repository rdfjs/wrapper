import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"

export interface ITermMapping<T> {
    (value: T, dataset: DatasetCore, factory: DataFactory): Term
}
