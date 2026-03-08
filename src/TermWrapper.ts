import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import { AnyTermWithContext } from "./AnyTermWithContext.js"
import type { IArcTransformation } from "./type/IArcTransformation.js"
import { ArcTransformation } from "./mapping/ArcTransformation.js"

export class TermWrapper extends AnyTermWithContext {
    get [Symbol.toStringTag]() {
        return this.constructor.name
    }

    protected singular<T>(p: string, termAs: ITermAsValueMapping<T>): T {
        return this.process(ArcTransformation.singular, p, undefined, termAs)
    }

    protected singularNullable<T>(p: string, termAs: ITermAsValueMapping<T>): T | undefined {
        return this.process(ArcTransformation.singularNullable, p, undefined, termAs)
    }

    protected overwrite<T>(p: string, value: T, termFrom: ITermFromValueMapping<T>): void {
        return this.process(ArcTransformation.overwrite, p, value, undefined, termFrom)
    }

    protected overwriteNullable<T>(p: string, value: T | undefined, termFrom: ITermFromValueMapping<T>): void {
        return this.process(ArcTransformation.overwriteNullable, p, value, undefined, termFrom)
    }

    protected objects<T>(p: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): Set<T> {
        return this.process(ArcTransformation.objects, p, undefined, termAs, termFrom)
    }

    protected map<TKey, TValue>(p: string, termAs: ITermAsValueMapping<[TKey, TValue]>, termFrom: ITermFromValueMapping<[TKey, TValue]>): Map<TKey, TValue> {
        return this.process(ArcTransformation.map, p, undefined, termAs, termFrom)
    }

    protected process<T>(transformation: IArcTransformation<T>, predicate: string, value?: T, termAs?: ITermAsValueMapping<T>, termFrom?: ITermFromValueMapping<T>): any {
        return transformation(this, predicate, value, termAs, termFrom)
    }
}
