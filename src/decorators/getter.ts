import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { TermWrapper } from "../TermWrapper.js"
import { GetterArity } from "./GetterArity.js"
import { LiteralFrom } from "../mapping/LiteralFrom.js"
import { RequiredFrom } from "../mapping/RequiredFrom.js"
import { OptionalFrom } from "../mapping/OptionalFrom.js"
import { SetFrom } from "../mapping/SetFrom.js"

export function getter(predicate: string, getterArity: GetterArity, termAs: ITermAsValueMapping<any>, termFrom: ITermFromValueMapping<any> = LiteralFrom.string): any {
    return function (target: any, context: ClassGetterDecoratorContext): any {
        return function (this: TermWrapper): any {
            switch (getterArity) {
                case GetterArity.Singular:
                    return RequiredFrom.subjectPredicate(this, predicate, termAs)
                case GetterArity.SingularNullable:
                    return OptionalFrom.subjectPredicate(this, predicate, termAs)
                case GetterArity.Set:
                    return SetFrom.subjectPredicate(this, predicate, termAs, termFrom)
            }
        }
    }
}
