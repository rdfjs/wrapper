import type { Quad, DatasetCoreFactory, Term, DatasetCore, BaseQuad } from "@rdfjs/types";
import type { DefaultDatasetCore } from "./DatasetWrapper.js";
import { NotifyingDatasetCore } from "./NotifyingDatasetCore.js";

export interface IterableDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = DatasetCore<OutQuad, InQuad>>
    extends DatasetCoreFactory<OutQuad, InQuad, D> {

        dataset(quads?: Iterable<InQuad>): D;
}

export interface NotifyingDatasetCoreFactory<OutQuad extends BaseQuad = Quad, InQuad extends BaseQuad = OutQuad, D extends DatasetCore<OutQuad, InQuad> = NotifyingDatasetCore<OutQuad, InQuad>>
    extends IterableDatasetCoreFactory<OutQuad, InQuad, D> {

    dataset(quads?: Iterable<InQuad>): D;
}


export class LazyMaterializedNotifyingDatasetCore<IQuad extends BaseQuad = Quad> implements NotifyingDatasetCore<IQuad, IQuad> {
    private materialized?: NotifyingDatasetCore<IQuad, IQuad> | undefined;
    private onAdd?: (quad: IQuad) => void;
    private onDelete?: (quad: IQuad) => void;

    public constructor(private readonly source: Iterable<IQuad>, private readonly datasetFactory: IterableDatasetCoreFactory<IQuad, IQuad, NotifyingDatasetCore<IQuad, IQuad>>) {

    }

    private get dataset(): NotifyingDatasetCore<IQuad, IQuad> {
        if (this.materialized === undefined) {
            this.materialized = this.datasetFactory.dataset();
            for (const q of this.source) {
                this.materialized.add(q);
            }
            this.onAdd = q => this.materialized!.add(q);
            this.onDelete = q => this.materialized!.delete(q);
            this.on('add', this.onAdd);
            this.on('delete', this.onDelete);
        }
        return this.materialized;
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
