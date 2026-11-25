import type { AsyncDatasetCore, DataFactory, Term } from "@rdfjs/types"
import { Example } from "../vocabulary/Example.js"

export class AsyncChild {
    public constructor(
        protected readonly term: Term,
        protected readonly dataset: AsyncDatasetCore,
        protected readonly factory: DataFactory,
    ) {
    }

    public get hasString(): Promise<string | undefined> {
        return (async () => {
            for await (const quad of this.dataset.match(this.term, this.factory.namedNode(Example.hasString))) {
                return quad.object.value
            }
            return undefined
        })()
    }
}
