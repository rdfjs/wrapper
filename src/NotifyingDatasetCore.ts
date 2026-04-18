import type { BaseQuad, DatasetCore, DatasetCoreFactory, Quad, Term } from "@rdfjs/types";
import { listeners } from "cluster";

export type ChangeEvent = 'add' | 'delete'
export type Listener<InQuad extends BaseQuad = Quad> = (event: ChangeEvent, quad: InQuad) => void

export interface NotifyingDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> extends DatasetCore<OutQuad, InQuad> {
    on(listener: Listener<InQuad>): void;
    off(listener: Listener<InQuad>): void;
    match(subject?: Term | null, predicate?: Term | null, object?: Term | null, graph?: Term | null): NotifyingDatasetCore<OutQuad, InQuad>;
}

export interface IterableDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = DatasetCore<OutQuad, InQuad>>
    extends DatasetCoreFactory<OutQuad, InQuad, D> {

        dataset(quads?: Iterable<InQuad>): D;
}

export interface NotifyingDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = NotifyingDatasetCore<OutQuad, InQuad>>
    extends IterableDatasetCoreFactory<OutQuad, InQuad, D> {

    dataset(quads?: Iterable<InQuad>): D;
}

export class EE<Args extends any[]> {
    public readonly listeners: Set<(...args: Args) => void> = new Set();

    on(listener: (...args: Args) => void): void {
        this.listeners.add(listener);
    }

    off(listener: (...args: Args) => void): void {
        this.listeners.delete(listener);
    }

    emit(...args: Args): void {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }
}

export class NotifyingDatasetCoreWrapper<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> implements NotifyingDatasetCore<OutQuad, InQuad> {
    private ee = new EE<[ChangeEvent, InQuad]>();

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

export function ensureNotifyingDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad>(dataset: DatasetCore<OutQuad, InQuad>): NotifyingDatasetCore<OutQuad, InQuad> {
    if ("on" in dataset && typeof dataset.on === "function" && "off" in dataset && typeof dataset.off === "function") {
        return dataset as NotifyingDatasetCore<OutQuad, InQuad>;
    } else {
        return new NotifyingDatasetCoreWrapper(dataset);
    }
}
