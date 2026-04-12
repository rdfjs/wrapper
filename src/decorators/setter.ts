import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import type { TermWrapper } from "../TermWrapper.js"
import { SetterArity } from "./SetterArity.js"
import { OptionalAs } from "../mapping/OptionalAs.js"
import { RequiredAs } from "../mapping/RequiredAs.js"

export function setter(predicate: string, setterArity: SetterArity, termFrom: ITermFromValueMapping<any>): any {
    return function (target: any, context: ClassSetterDecoratorContext): any {
        return function (this: TermWrapper, value: any): void {
            switch (setterArity) {
                case SetterArity.Singular:
                    return RequiredAs.object(this.node, predicate, value, termFrom)
                case SetterArity.SingularNullable:
                    return OptionalAs.object(this.node, predicate, value, termFrom)
            }
        }
    }
}
