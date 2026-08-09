import type { DataFactory } from "@rdfjs/types"
import { DataFactory as N3DataFactory } from "n3"
import type { Triple } from "@rdfjs/wrapper"

export const dataFactory: DataFactory<Triple, Triple> = N3DataFactory as unknown as DataFactory<Triple, Triple>
