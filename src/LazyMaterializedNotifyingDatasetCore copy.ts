import type { BaseQuad, DatasetCore, Quad, Term } from "@rdfjs/types";
import { IterableDatasetCoreFactory, NotifyingDatasetCore } from "./NotifyingDatasetCore.js";

/**
 * Best-effort cleanup registry. When a wrapper instance is garbage
 * collected without `[Symbol.dispose]()` having been invoked, the held
 * cleanup function is run to detach listeners from the materialized
 * dataset. This protects against listener leaks when the wrapper
 * subscribes to a dataset that outlives it.
 *
 * IMPORTANT: the held value and unregister token must not strongly
 * reference the wrapper instance, or the registry will keep it alive
 * and the finalizer will never run.
 */
const lazyMaterializedFinalizers = new FinalizationRegistry<() => void>(cleanup => {
    try {
        cleanup();
    } catch {
        // Finalizers must not throw; swallow any error from a torn-down dataset.
    }
});

export class LazyMaterializedNotifyingDatasetCore<IQuad extends BaseQuad = Quad> implements NotifyingDatasetCore<IQuad, IQuad>, Disposable {
    private materialized?: NotifyingDatasetCore<IQuad, IQuad> | undefined;
    private onAdd?: ((quad: IQuad) => void) | undefined;
    private onDelete?: ((quad: IQuad) => void) | undefined;
    /**
     * Token used to unregister this instance from the finalization
     * registry when listeners are detached deterministically via
     * `[Symbol.dispose]()`. An object literal is used so the token is
     * unique per instance without referencing `this`.
     */
    private readonly finalizerToken: object = {};

    public constructor(private readonly source: DatasetCore<IQuad>, private readonly datasetFactory: IterableDatasetCoreFactory<IQuad, IQuad, NotifyingDatasetCore<IQuad, IQuad>>) {

    }

    [Symbol.iterator](): Iterator<IQuad> {
        if (this.materialized) {
            return this.materialized[Symbol.iterator]();
        }
        return this.source[Symbol.iterator]();
    }

    get size(): number {
        if (this.materialized) {
            return this.materialized.size;
        }
        let count = 0;
        for (const _ of this.source) count++;
        return count;
    }

    add(quad: IQuad): this {
        this.dataset.add(quad);
        return this;
    }

    delete(quad: IQuad): this {
        this.dataset.delete(quad);
        return this;
    }

    has(quad: IQuad): boolean {
        if (this.materialized) {
            return this.materialized.has(quad);
        }
        for (const q of this.source) {
            if (q.equals(quad)) {
                return true;
            }
        }
        return false;
    }

    match(subject?: Term, predicate?: Term, object?: Term): NotifyingDatasetCore<IQuad, IQuad> {
        return this.dataset.match(subject, predicate, object);
    }

    on(...args: Parameters<NotifyingDatasetCore<IQuad, IQuad>["on"]>): void {
        this.dataset.on(...args);
    }

    off(...args: Parameters<NotifyingDatasetCore<IQuad, IQuad>["off"]>): void {
        this.dataset.off(...args);
    }
}
