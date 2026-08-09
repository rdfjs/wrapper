import type { BaseQuad, DatasetCore, Quad } from "@rdfjs/types";
import { ChangeEvent, IterableDatasetCoreFactory, Listener, NotifyingDatasetCore } from "./NotifyingDatasetCore.js";
import { PatternEventEmitter } from "../EventEmitter.js";

/**
 * A quad pattern: any subset of subject / predicate / object / graph.
 * Missing fields act as wildcards that match any term in that position.
 */
export interface IPattern<OutQuad extends BaseQuad = Quad> {
    subject?: OutQuad['subject'] | undefined,
    predicate?: OutQuad['predicate'] | undefined,
    object?: OutQuad['object'] | undefined,
    graph?: OutQuad['graph'] | undefined,
};

/** Carries an {@link IPattern} - implemented by lazy / projected views. */
export interface Pattern<OutQuad extends BaseQuad = Quad> {
    pattern: IPattern<OutQuad>;
}

/**
 * Minimal interface that a {@link LazyMatchNotifyingDatasetCore} needs from
 * its backing source: the standard mutating / matching methods and a way to
 * subscribe to change events.
 */
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

/**
 * A {@link NotifyingDatasetCore} that exposes a quad-pattern view over a
 * notifying source dataset.
 *
 * The view is **lazily materialized**: the matching quads are only copied
 * into an internal dataset when needed (e.g. on the first call to
 * {@link size}, {@link has} or repeated iteration). Once materialized, the
 * view subscribes to the source's change events and keeps the cached set in
 * sync, so it remains a live view of the underlying data.
 *
 * - {@link add} / {@link delete} are forwarded to the source (the source's
 *   change notification updates the materialized cache).
 * - {@link has} answers from the cache when materialized, otherwise from the
 *   source.
 * - {@link match} returns another {@link LazyMatchNotifyingDatasetCore} that
 *   intersects the requested pattern with the current view's pattern. If the
 *   patterns conflict (different bound terms in the same position) an
 *   {@link EmptyDataset} is returned.
 * - {@link on} / {@link off} subscribe to source changes filtered by the
 *   view's pattern.
 *
 * The class implements {@link Disposable}: prefer the `using` declaration so
 * that listeners are detached deterministically. A {@link FinalizationRegistry}
 * provides a best-effort safety net when explicit disposal is missed.
 */
export class LazyMatchNotifyingDatasetCore<IQuad extends BaseQuad = Quad> implements NotifyingDatasetCore<IQuad, IQuad>, Pattern<IQuad>, Disposable {
    private materialized?: DatasetCore<IQuad, IQuad> | undefined;
    private cb?: ((event: ChangeEvent, q: IQuad) => void) | undefined;

    /**
     * Bound source listener that forwards change events to the pattern
     * emitter. Stored once so the *same* function reference is added to and
     * removed from the source - a fresh closure per call would be a different
     * reference and {@link IterableSource.off} would silently fail.
     *
     * The `=> this.ee.emit(...)` form preserves the `this` context that
     * {@link PatternEventEmitter.emit} relies on.
     */
    private readonly emitToEe: (event: ChangeEvent, q: IQuad) => void;

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
        const ee = this.ee;
        this.emitToEe = (event, q) => ee.emit(event, q);
    }

    /**
     * Subscribes the materialized cache to source changes so it stays in
     * sync. The closure intentionally captures `ds` and `source` - never
     * `this` - so the wrapper remains eligible for garbage collection and
     * the finalizer can run.
     */
    private init(ds: DatasetCore<IQuad, IQuad>): void {
        const cb = (event: ChangeEvent, q: IQuad): void => { ds[event](q); };
        this.cb = cb;
        const source = this.source;

        source.on(cb);

        // Register a best-effort finalizer. The cleanup closure only
        // references `source` and the local handler - never `this` -
        // so the wrapper remains eligible for garbage collection.
        lazyMaterializedFinalizers.register(
            this,
            () => source.off(cb),
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
        if (this.cb) {
            this.source.off(this.cb);
            lazyMaterializedFinalizers.unregister(this.finalizerToken);
        }
        if (!this.ee.empty) {
            this.source.off(this.emitToEe);
        }
        this.cb = undefined;
        this.materialized = undefined;
    }

    public *[Symbol.iterator](): Iterator<IQuad> {
        // If already materialized, delegate to the dataset's iterator.
        // NOTE: `yield*` is required - `return iterator` from a generator
        // would set the generator's return value rather than iterating.
        if (this.materialized) {
            yield* this.materialized;
            return;
        }

        // Stream and materialize in a single pass, deduplicating along the way.
        const materialized = this.datasetFactory.dataset();
        for (const q of this.source.match(this.pattern.subject, this.pattern.predicate, this.pattern.object, this.pattern.graph)) {
            if (!materialized.has(q)) {
                yield q;
                materialized.add(q);
            }
        }

        this.materialized = materialized;
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
        const pattern: IPattern<IQuad> = { subject, predicate, object, graph };

        for (const key of ['subject', 'predicate', 'object', 'graph'] as const) {
            const requested = pattern[key];
            const existing = this.pattern[key];
            if (requested !== undefined && existing !== undefined && !requested.equals(existing)) {
                // Pattern and argument conflict; return an empty dataset.
                return EMPTY_DATASET as NotifyingDatasetCore<IQuad, IQuad>;
            }
            pattern[key] ??= existing;
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
            this.source.on(this.emitToEe);
        }
        this.ee.on(this.pattern, ...args);
    }

    off(...args: Parameters<NotifyingDatasetCore<IQuad, IQuad>["off"]>): void {
        this.ee.off(this.pattern, ...args);
        if (this.ee.empty) {
            this.source.off(this.emitToEe);
        }
    }
}

/**
 * A {@link NotifyingDatasetCore} that contains no quads. Returned by
 * {@link LazyMatchNotifyingDatasetCore.match} when the requested pattern
 * conflicts with the view's existing pattern. Mutations are not supported
 * and throw.
 */
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

const EMPTY_DATASET = new EmptyDataset();
