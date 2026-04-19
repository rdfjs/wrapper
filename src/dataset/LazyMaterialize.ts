import type { BaseQuad, DatasetCore, Quad } from "@rdfjs/types";
import { ChangeEvent, IterableDatasetCoreFactory, Listener, NotifyingDatasetCore } from "./NotifyingDatasetCore.js";
import { EventEmitter, PatternEventEmitter } from "../EventEmitter.js";

export interface IPattern<OutQuad extends BaseQuad = Quad> {
    subject?: OutQuad['subject'] | undefined,
    predicate?: OutQuad['predicate'] | undefined,
    object?: OutQuad['object'] | undefined,
    graph?: OutQuad['graph'] | undefined,
};

export interface Pattern<OutQuad extends BaseQuad = Quad> {
    pattern: IPattern<OutQuad>;
}

interface IterableSource<OutQuad extends BaseQuad = Quad> {
    match: (subject?: OutQuad['subject'], predicate?: OutQuad['predicate'], object?: OutQuad['object'], graph?: OutQuad['graph']) => Iterable<OutQuad>;
    add: (quad: OutQuad) => void;
    delete: (quad: OutQuad) => void;
    has: (quad: OutQuad) => boolean;
    on: (listener: Listener<OutQuad>) => void;
    off: (listener: Listener<OutQuad>) => void;
}

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

// Lazily materialized dataset, which keeps in sync with source
export class LazyMatchNotifyingDatasetCore<IQuad extends BaseQuad = Quad> implements NotifyingDatasetCore<IQuad, IQuad>, Pattern<IQuad>, Disposable {
    private materialized?: DatasetCore<IQuad, IQuad> | undefined;
    private cb?: ((event: ChangeEvent, q: IQuad) => void) | undefined;

    /**
     * Token used to unregister this instance from the finalization
     * registry when listeners are detached deterministically via
     * `[Symbol.dispose]()`. An object literal is used so the token is
     * unique per instance without referencing `this`.
     */
    private readonly finalizerToken: object = {};

    public constructor(
        private readonly source: IterableSource<IQuad>,
        public readonly pattern: IPattern<IQuad>,
        private readonly datasetFactory: IterableDatasetCoreFactory<IQuad, IQuad, NotifyingDatasetCore<IQuad, IQuad>>,
    ) {

    }

    private init(ds: DatasetCore<IQuad, IQuad>): void {
        const cb = (event: ChangeEvent, q: IQuad): void => { ds[event](q); };
        this.cb = cb;
        const self = this;

        self.on(cb);

        // Register a best-effort finalizer. The cleanup closure only
        // references `ds` and the local handlers - never `this` -
        // so the wrapper remains eligible for garbage collection.
        lazyMaterializedFinalizers.register(
            this,
            () => self.off(cb),
            this.finalizerToken,
        );
    }

    private get dataset(): DatasetCore<IQuad, IQuad> {
        if (this.materialized === undefined) {
            // Capture `ds` locally so the listener closures do not close over `this`.
            // This avoids creating a strong self-reference cycle through the listener list.
            const ds = this.datasetFactory.dataset();
            for (const q of this.source.match(this.pattern.subject, this.pattern.predicate, this.pattern.object, this.pattern.graph)) {
                ds.add(q);
            }
            this.materialized = ds;
            this.init(ds);
        }
        return this.materialized;
    }

    /**
     * Detaches listeners and releases the materialized dataset so this
     * instance (and anything it referenced) becomes eligible for garbage
     * collection. After disposal the wrapper must not be used again.
     *
     * Prefer using the `using` declaration to invoke this automatically:
     *
     *   using ds = new LazyMaterializedNotifyingDatasetCore(src, factory);
     *
     * If `[Symbol.dispose]()` is never called, a `FinalizationRegistry`
     * will detach the listeners on a best-effort basis once the wrapper
     * is garbage collected. Finalizer execution is not guaranteed by the
     * specification, so deterministic disposal should still be preferred.
     */
    [Symbol.dispose](): void {
        if (this.materialized) {
            if (this.cb) {
                this.off(this.cb);
            }
            lazyMaterializedFinalizers.unregister(this.finalizerToken);
        }
        this.cb = undefined;
        this.materialized = undefined;
    }

    public *[Symbol.iterator](): Iterator<IQuad> {
        // If already materialized, delegate to the dataset's iterator.
        if (this.materialized) {
            return this.materialized[Symbol.iterator]();
        }

        const materialized = this.datasetFactory.dataset();
        for (const q of this.source.match(this.pattern.subject, this.pattern.predicate, this.pattern.object, this.pattern.graph)) {
            if (!materialized.has(q)) {
                yield q;
                materialized.add(q);
            }
        }

        this.init(materialized);
    }

    get size(): number {
        return this.dataset.size;
    }

    add(quad: IQuad): this {
        // Add to the source dataset, which will trigger the listener to add to the materialized dataset if it exists.
        // This ensures all mutations are funneled through the source and observed in the materialized dataset.
        this.source.add(quad);
        return this;
    }

    delete(quad: IQuad): this {
        // Delete from the source dataset, which will trigger the listener to delete from the materialized dataset if it exists.
        this.source.delete(quad);
        return this;
    }

    has(quad: IQuad): boolean {
        if (this.materialized) {
            return this.materialized.has(quad);
        }
        return this.source.has(quad);
    }

    match(subject?: IQuad['subject'], predicate?: IQuad['predicate'], object?: IQuad['object'], graph?: IQuad['graph']): NotifyingDatasetCore<IQuad, IQuad> {
        let pattern: IPattern<IQuad> = { subject, predicate, object, graph };

        for (const key of ['subject', 'predicate', 'object', 'graph'] as const) {
            if (pattern[key] !== undefined && this.pattern[key] !== undefined && !pattern[key].equals(this.pattern[key])) {
                // Pattern and argument conflict; return an empty dataset.
                return EMTY_DATASET;
            }
            pattern[key] ??= this.pattern[key];
        }

        return new LazyMatchNotifyingDatasetCore<IQuad>(
            this.source,
            pattern,
            this.datasetFactory,
        );
    }

    private ee = new PatternEventEmitter<IQuad>();

    on(...args: Parameters<NotifyingDatasetCore<IQuad, IQuad>["on"]>): void {
        if (this.ee.empty) {
            this.source.on(this.ee.emit);
        }
        this.ee.on(this.pattern, ...args);
    }

    off(...args: Parameters<NotifyingDatasetCore<IQuad, IQuad>["off"]>): void {
        this.ee.off(this.pattern, ...args);
        if (this.ee.empty) {
            this.source.off(this.ee.emit);
        }
    }
}

export class EmptyDataset<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> implements NotifyingDatasetCore<OutQuad, InQuad> {
    size = 0;

    has(): boolean {
        return false;
    }

    add(): this {
        throw new Error("Cannot add to an empty dataset");
    }

    delete(): this {
        throw new Error("Cannot delete from an empty dataset");
    }

    match(): EmptyDataset<OutQuad, InQuad> {
        return this;
    }

    *[Symbol.iterator](): Iterator<never> {
        // No quads to iterate over
    }

    on(): void {
        // No-op, as there will never be any events
    }

    off(): void {
        // No-op, as there will never be any events
    }
}

const EMTY_DATASET = new EmptyDataset();
