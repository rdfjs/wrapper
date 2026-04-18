import type { BaseQuad, DatasetCore, DatasetCoreFactory, Quad, Term } from "@rdfjs/types";

export interface NotifyingDatasetCore<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> extends DatasetCore<OutQuad, InQuad> {
    on(event: 'add' | 'delete', listener: (quad: InQuad) => void): void;
    off(event: 'add' | 'delete', listener: (quad: InQuad) => void): void;
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

export class NotifyingDatasetCoreWrapper<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad> implements NotifyingDatasetCore<OutQuad, InQuad> {
    private callbacks: Map<'add' | 'delete', Array<(quad: InQuad) => void>> = new Map([
        ['add', []],
        ['delete', []],
    ]);

    constructor(private readonly dataset: DatasetCore<OutQuad, InQuad>) {
    }

    on(event: 'add' | 'delete', listener: (quad: InQuad) => void): void {
        if (event === 'add' || event === 'delete') {
            this.callbacks.get(event)!.push(listener);
        } else {
            throw new Error(`Unsupported event type: ${event}`);
        }
    }

    off(event: 'add' | 'delete', listener: (quad: InQuad) => void): void {
        if (event === 'add' || event === 'delete') {
            const listeners = this.callbacks.get(event);
            if (listeners) {
                this.callbacks.set(event, listeners.filter(cb => cb !== listener));
            }
        } else {
            throw new Error(`Unsupported event type: ${event}`);
        }
    }

    get size(): number {
        return this.dataset.size;
    }

    public [Symbol.iterator](): Iterator<OutQuad> {
        return this.dataset[Symbol.iterator]();
    }

    add(quad: InQuad): this {
        this.dataset.add(quad);
        this.callbacks.get('add')!.forEach(cb => cb(quad));
        return this;
    }

    delete(quad: InQuad): this {
        this.dataset.delete(quad);
        this.callbacks.get('delete')!.forEach(cb => cb(quad));
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
