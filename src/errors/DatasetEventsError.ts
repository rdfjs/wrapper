import { WrapperError } from "./WrapperError.js"
import type { DatasetCore } from "@rdfjs/types"

/**
 * Thrown when change notifications are requested over a dataset that does not emit them.
 *
 * @remarks
 * Subscribing to changes (for example via {@link WrappingSet.on}) requires the underlying {@link DatasetCore} to also be a Node.js [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter) that emits `"add"` and `"delete"` events carrying the affected quad, such as `EventfulDatasetCore` from the [@jeswr/eventful-dataset](https://github.com/jeswr/eventful-dataset) package.
 *
 * @see
 * - {@link WrappingSet.on}
 * - {@link DatasetCore}
 */
export class DatasetEventsError extends WrapperError {
    /**
     * Creates a new instance of {@link DatasetEventsError}.
     *
     * @param dataset - The dataset that does not emit change events.
     * @param cause - The specific original cause of the error.
     */
    constructor(public readonly dataset: DatasetCore, cause?: any) {
        super("Dataset does not emit change events. Use a dataset that emits 'add' and 'delete' quad events, like EventfulDatasetCore.", cause)
    }
}
