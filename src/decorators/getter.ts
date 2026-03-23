import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { TermWrapper } from "../TermWrapper.js"

import { GetterArity } from "./GetterArity.js"
import { LiteralFrom } from "../mapping/LiteralFrom.js"

export function getter(predicate: string, getterArity: GetterArity, termAs: ITermAsValueMapping<any>, termFrom: ITermFromValueMapping<any> = LiteralFrom.string): any {
    return function (target: any, context: ClassGetterDecoratorContext): any {
        return function (this: TermWrapper): any {
            switch (getterArity) {
                case GetterArity.Singular:
                    return this.singular(predicate, termAs)
                case GetterArity.SingularNullable:
                    return this.singularNullable(predicate, termAs)
                case GetterArity.Set:
                    return this.objects(predicate, termAs, termFrom)
            }
        }
    }
}
