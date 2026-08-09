import type { BaseQuad, DatasetCore, DefaultGraph, Quad } from "@rdfjs/types"
import type { AsyncDatasetCore, AsyncDatasetCoreFactory } from "./AsyncDatasetCore.js"
import type { ChangeEvent } from "../dataset/NotifyingDatasetCore.js"

/**
 * A change-event listener for {@link AsyncNotifyingDatasetCore}. May
 * return either `void` or a {@link Promise} (which the dataset will
 * await before invoking the next listener).
 */
export type AsyncListener<InQuad extends BaseQuad = Quad> =
    (event: ChangeEvent, quad: InQuad) => void | Promise<void>

/**
 * The asynchronous counterpart of {@link "../dataset/NotifyingDatasetCore.js"!NotifyingDatasetCore}:
 * an {@link AsyncDatasetCore} that emits change events when quads are
 * added or removed.
 */
export interface AsyncNotifyingDatasetCore<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad,
> extends AsyncDatasetCore<OutQuad, InQuad> {
    on(listener: AsyncListener<InQuad>): void
    off(listener: AsyncListener<InQuad>): void
    match(
        subject?: OutQuad["subject"] | null,
        predicate?: OutQuad["predicate"] | null,
        object?: OutQuad["object"] | null,
        graph?: OutQuad["graph"] | null,
    ): AsyncNotifyingDatasetCore<OutQuad, InQuad>
}

/**
 * A {@link DefaultGraph}-restricted view of an
 * {@link AsyncNotifyingDatasetCore}, used by {@link AsyncDatasetWrapper}.
 * Mirrors the synchronous `DefaultDatasetCore` type.
 */
export interface AsyncDefaultDatasetCore<Q extends BaseQuad = Quad>
    extends AsyncNotifyingDatasetCore<Q, Q> {
    match(
        subject: Q["subject"] | undefined,
        predicate: Q["predicate"] | undefined,
        object: Q["object"] | undefined,
        graph: DefaultGraph,
    ): AsyncDefaultDatasetCore<Q>
}

/**
 * An {@link AsyncDatasetCoreFactory} that produces
 * {@link AsyncNotifyingDatasetCore} instances. Mirrors the relationship
 * between `IterableDatasetCoreFactory` and `NotifyingDatasetCoreFactory`
 * in the synchronous API.
 */
export interface AsyncNotifyingDatasetCoreFactory<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad,
    D extends AsyncDatasetCore<OutQuad, InQuad> = AsyncNotifyingDatasetCore<OutQuad, InQuad>,
> extends AsyncDatasetCoreFactory<OutQuad, InQuad, D> {
    dataset(quads?: AsyncIterable<InQuad> | Iterable<InQuad>): Promise<D>
}

/**
 * Wraps any {@link AsyncDatasetCore} (or a synchronous {@link DatasetCore},
 * which it treats as if every call were already resolved) and surfaces
 * change events on `add` / `delete`.
 *
 * Notifications are dispatched _after_ the underlying mutation has
 * completed; if a listener returns a {@link Promise}, the dataset awaits
 * it before invoking the next listener. The set of listeners snapshot
 * at the start of each emit, so adding or removing listeners inside a
 * listener does not affect the in-flight dispatch.
 *
 * @example Bridging a synchronous store
 * ```ts
 * import { Store } from "n3"
 *
 * const store = new Store()
 * const asyncDataset = new AsyncNotifyingDatasetCoreWrapper(store)
 *
 * asyncDataset.on(async (event, quad) => {
 *   await audit.record(event, quad)
 * })
 *
 * await asyncDataset.add(quad)
 * console.log(await asyncDataset.size)
 * ```
 */
export class AsyncNotifyingDatasetCoreWrapper<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad,
> implements AsyncNotifyingDatasetCore<OutQuad, InQuad> {
    private readonly listeners = new Set<AsyncListener<InQuad>>()
    private readonly inner: AsyncDatasetCore<OutQuad, InQuad>

    public constructor(dataset: AsyncDatasetCore<OutQuad, InQuad> | DatasetCore<OutQuad, InQuad>) {
        this.inner = isAsync(dataset) ? dataset : new SyncToAsyncDatasetAdapter(dataset)
    }

    on(listener: AsyncListener<InQuad>): void {
        this.listeners.add(listener)
    }

    off(listener: AsyncListener<InQuad>): void {
        this.listeners.delete(listener)
    }

    get size(): Promise<number> {
        return this.inner.size
    }

    [Symbol.asyncIterator](): AsyncIterator<OutQuad> {
        return this.inner[Symbol.asyncIterator]()
    }

    async add(quad: InQuad): Promise<this> {
        await this.inner.add(quad)
        await this.emit("add", quad)
        return this
    }

    async delete(quad: InQuad): Promise<this> {
        await this.inner.delete(quad)
        await this.emit("delete", quad)
        return this
    }

    has(quad: InQuad): Promise<boolean> {
        return this.inner.has(quad)
    }

    match(
        subject?: OutQuad["subject"] | null,
        predicate?: OutQuad["predicate"] | null,
        object?: OutQuad["object"] | null,
        graph?: OutQuad["graph"] | null,
    ): AsyncNotifyingDatasetCore<OutQuad, InQuad> {
        return ensureAsyncNotifyingDatasetCore(this.inner.match(subject, predicate, object, graph))
    }

    private async emit(event: ChangeEvent, quad: InQuad): Promise<void> {
        // Snapshot listeners so detach/attach during emit does not affect
        // the in-flight dispatch.
        const snapshot = Array.from(this.listeners)
        for (const listener of snapshot) {
            const r = listener(event, quad)
            if (r !== undefined) {
                await r
            }
        }
    }
}

/**
 * Returns `dataset` unchanged if it is already an
 * {@link AsyncNotifyingDatasetCore}, otherwise wraps it in an
 * {@link AsyncNotifyingDatasetCoreWrapper}. Convenient when the caller
 * does not know whether the supplied dataset already supports change
 * notifications.
 */
export function ensureAsyncNotifyingDatasetCore<
    OutQuad extends BaseQuad = Quad,
    InQuad extends BaseQuad = OutQuad,
>(dataset: AsyncDatasetCore<OutQuad, InQuad> | DatasetCore<OutQuad, InQuad>): AsyncNotifyingDatasetCore<OutQuad, InQuad> {
    if (
        "on" in dataset && typeof (dataset as { on?: unknown }).on === "function" &&
        "off" in dataset && typeof (dataset as { off?: unknown }).off === "function" &&
        Symbol.asyncIterator in dataset
    ) {
        return dataset as AsyncNotifyingDatasetCore<OutQuad, InQuad>
    }
    return new AsyncNotifyingDatasetCoreWrapper(dataset)
}

function isAsync<O extends BaseQuad, I extends BaseQuad>(
    dataset: AsyncDatasetCore<O, I> | DatasetCore<O, I>,
): dataset is AsyncDatasetCore<O, I> {
    return Symbol.asyncIterator in dataset
}

/**
 * Bridges a synchronous {@link DatasetCore} into the async surface so
 * implementations like the n3 `Store` can be exposed through the async
 * pipeline. Every method simply wraps the synchronous result in a
 * resolved {@link Promise}.
 */
class SyncToAsyncDatasetAdapter<OutQuad extends BaseQuad, InQuad extends BaseQuad>
    implements AsyncDatasetCore<OutQuad, InQuad> {
    public constructor(private readonly inner: DatasetCore<OutQuad, InQuad>) {}

    get size(): Promise<number> {
        return Promise.resolve(this.inner.size)
    }

    async add(quad: InQuad): Promise<this> {
        this.inner.add(quad)
        return this
    }

    async delete(quad: InQuad): Promise<this> {
        this.inner.delete(quad)
        return this
    }

    async has(quad: InQuad): Promise<boolean> {
        return this.inner.has(quad)
    }

    match(
        subject?: OutQuad["subject"] | null,
        predicate?: OutQuad["predicate"] | null,
        object?: OutQuad["object"] | null,
        graph?: OutQuad["graph"] | null,
    ): AsyncDatasetCore<OutQuad, InQuad> {
        return new SyncToAsyncDatasetAdapter(
            this.inner.match(
                subject ?? undefined,
                predicate ?? undefined,
                object ?? undefined,
                graph ?? undefined,
            ),
        )
    }

    async *[Symbol.asyncIterator](): AsyncIterator<OutQuad> {
        for (const q of this.inner) {
            yield q
        }
    }
}
