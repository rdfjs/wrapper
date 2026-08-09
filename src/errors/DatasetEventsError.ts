import { WrapperError } from "./WrapperError.js"
import type { AsyncDatasetCore, DatasetCore } from "@rdfjs/types"

/**
 * Thrown when change notifications are requested over a dataset that does not emit them.
 *
 * @remarks
 * Subscribing to changes (for example via {@link AsyncWrappingSet.on}) requires the underlying dataset to notify subscribers of `"add"` and `"delete"` changes carrying the affected quad. On the asynchronous surface that is the contract exposed by {@link AsyncDatasetWrapper.on | AsyncDatasetWrapper}.
 *
 * @see
 * - {@link AsyncWrappingSet.on}
 * - {@link AsyncDatasetWrapper.on}
 */
export class DatasetEventsError extends WrapperError {
    /**
     * Creates a new instance of {@link DatasetEventsError}.
     *
     * @param dataset - The dataset that does not emit change events.
     * @param cause - The specific original cause of the error.
     */
    constructor(public readonly dataset: DatasetCore | AsyncDatasetCore, cause?: any) {
        super("Dataset does not emit change events. Use a dataset that notifies subscribers of 'add' and 'delete' changes, like AsyncDatasetWrapper.", cause)
    }
}
