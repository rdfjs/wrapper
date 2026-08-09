import type { BaseQuad, DatasetCore, DatasetCoreFactory, Quad } from "@rdfjs/types";
import { EventEmitter } from "../EventEmitter.js";

/** Type of mutation reported by a {@link NotifyingDatasetCore}. */
export type ChangeEvent = 'add' | 'delete'

/** Listener callback invoked when a {@link NotifyingDatasetCore} changes. */
export type Listener<InQuad extends BaseQuad = Quad> = (event: ChangeEvent, quad: InQuad) => void

/**
 * A {@link DatasetCore} that emits change events when quads are added or
 * removed.
 *
 * Listeners attached via {@link on} are invoked with the change type
 * (`'add'` or `'delete'`) and the affected quad. {@link match} returns a
 * {@link NotifyingDatasetCore} as well so the same notification mechanism
 * is available on derived views.
 */
export interface NotifyingDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> extends DatasetCore<OutQuad, InQuad> {
    /** Subscribes `listener` to this dataset's change events. */
    on(listener: Listener<InQuad>): void;
    /** Detaches a previously {@link on}-attached listener. */
    off(listener: Listener<InQuad>): void;
    match(...args: Parameters<DatasetCore<OutQuad, InQuad>["match"]>): NotifyingDatasetCore<OutQuad, InQuad>;
}

/**
 * A {@link DatasetCoreFactory} whose `dataset` method accepts any iterable
 * of quads (not just an array as the standard interface allows).
 */
export interface IterableDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = DatasetCore<OutQuad, InQuad>>
    extends DatasetCoreFactory<OutQuad, InQuad, D> {

        dataset(quads?: Iterable<InQuad>): D;
}

/**
 * An {@link IterableDatasetCoreFactory} that produces
 * {@link NotifyingDatasetCore} instances.
 */
export interface NotifyingDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = NotifyingDatasetCore<OutQuad, InQuad>>
    extends IterableDatasetCoreFactory<OutQuad, InQuad, D> {

    dataset(quads?: Iterable<InQuad>): D;
}

/**
 * Wraps an arbitrary {@link DatasetCore} and turns it into a
 * {@link NotifyingDatasetCore} by intercepting `add` and `delete` and
 * emitting change events to subscribers.
 *
 * The wrapper does **not** guard against the underlying dataset's behaviour
 * for redundant operations: events are emitted unconditionally on every
 * `add` / `delete` call, even when adding a quad that already exists or
 * deleting a quad that does not.
 */
export class NotifyingDatasetCoreWrapper<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> implements NotifyingDatasetCore<OutQuad, InQuad> {
    private ee = new EventEmitter<[ChangeEvent, InQuad]>();

    constructor(private readonly dataset: DatasetCore<OutQuad, InQuad>) {
    }

    on(listener: Listener<InQuad>): void {
        this.ee.on(listener);
    }

    off(listener: Listener<InQuad>): void {
        this.ee.off(listener);
    }

    get size(): number {
        return this.dataset.size;
    }

    public [Symbol.iterator](): Iterator<OutQuad> {
        return this.dataset[Symbol.iterator]();
    }

    add(quad: InQuad): this {
        this.dataset.add(quad);
        this.ee.emit('add', quad);
        return this;
    }

    delete(quad: InQuad): this {
        this.dataset.delete(quad);
        this.ee.emit('delete', quad);
        return this;
    }

    has(quad: InQuad): boolean {
        return this.dataset.has(quad);
    }

    match(...args: Parameters<DatasetCore<OutQuad, InQuad>["match"]>): NotifyingDatasetCore<OutQuad, InQuad> {
        return ensureNotifyingDatasetCore(this.dataset.match(...args));
    }
}

/**
 * Returns `dataset` if it is already a {@link NotifyingDatasetCore},
 * otherwise wraps it in a {@link NotifyingDatasetCoreWrapper}. Useful for
 * accepting any RDF/JS dataset implementation while still being able to
 * subscribe to changes.
 */
export function ensureNotifyingDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad>(dataset: DatasetCore<OutQuad, InQuad>): NotifyingDatasetCore<OutQuad, InQuad> {
    if ("on" in dataset && typeof dataset.on === "function" && "off" in dataset && typeof dataset.off === "function") {
        return dataset as NotifyingDatasetCore<OutQuad, InQuad>;
    } else {
        return new NotifyingDatasetCoreWrapper(dataset);
    }
}
