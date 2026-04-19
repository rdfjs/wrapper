import type { DataFactory, Term } from "@rdfjs/types"
import type { AsyncDefaultDatasetCore } from "../AsyncNotifyingDatasetCore.js"
import type { Triple } from "../../type/ITriple.js"
import { AsyncTermWrapper } from "../AsyncTermWrapper.js"

/**
 * Constructor signature for an {@link AsyncTermWrapper} subclass. Mirrors
 * {@link "../../type/ITermWrapperConstructor.js"!ITermWrapperConstructor}
 * for the asynchronous surface.
 */
export type IAsyncTermWrapperConstructor<T> = new (
    term: Term,
    dataset: AsyncDefaultDatasetCore<Triple>,
    factory: DataFactory<Triple, Triple>,
) => T
