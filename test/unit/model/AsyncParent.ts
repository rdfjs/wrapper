import type { AsyncWrappingSet, ILangString } from "@rdfjs/wrapper"
import {
    AsyncLiteralAs,
    AsyncOptionalAs,
    AsyncOptionalFrom,
    AsyncRequiredAs,
    AsyncRequiredFrom,
    AsyncSetFrom,
    AsyncTermAs,
    AsyncTermWrapper,
    BlankNodeFrom,
    LiteralFrom,
    NamedNodeFrom,
    TermFrom
} from "@rdfjs/wrapper"
import { Example } from "../vocabulary/Example.js"
import { AsyncChild } from "./AsyncChild.js"

export class AsyncParent extends AsyncTermWrapper {
    /* Value Mapping */
    public get hasBlankNode(): Promise<string> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasBlankNode, AsyncLiteralAs.string)
    }

    public get hasDate(): Promise<Date> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasDate, AsyncLiteralAs.date)
    }

    public get hasLangString(): Promise<ILangString> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasLangString, AsyncLiteralAs.langString)
    }

    public get hasNumber(): Promise<number> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasNumber, AsyncLiteralAs.number)
    }

    public get hasBoolean(): Promise<boolean> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasBoolean, AsyncLiteralAs.boolean)
    }

    public get hasString(): Promise<string> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasString, AsyncLiteralAs.string)
    }

    public get hasIri(): Promise<string> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasIri, AsyncLiteralAs.string)
    }


    /* Term Mapping */
    public setHasBlankNode(value: string): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasBlankNode, value, BlankNodeFrom.string)
    }

    public setHasDate(value: Date): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasDate, value, LiteralFrom.date)
    }

    public setHasLangString(value: ILangString): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasLangString, value, LiteralFrom.langString)
    }

    public setHasNumber(value: number): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasNumber, value, LiteralFrom.double)
    }

    public setHasBoolean(value: boolean): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasBoolean, value, LiteralFrom.boolean)
    }

    public setHasString(value: string): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasString, value, LiteralFrom.string)
    }

    public setHasIri(value: string): Promise<void> {
        return AsyncRequiredAs.object(this, Example.hasIri, value, NamedNodeFrom.string)
    }


    /* Object Mapping */
    public get hasChild(): Promise<AsyncChild> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasChild, AsyncTermAs.instance(AsyncChild))
    }

    public setHasChild(value: AsyncChild): Promise<void> {
        return AsyncOptionalAs.object(this, Example.hasChild, value, TermFrom.instance)
    }


    /* Arity Mapping */
    public get hasNoSingularString(): Promise<string> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasNoSingularString, AsyncLiteralAs.string)
    }

    public get hasTooManySingularString(): Promise<string> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasTooManySingularString, AsyncLiteralAs.string)
    }

    public get hasNullableString(): Promise<string | undefined> {
        return AsyncOptionalFrom.subjectPredicate(this, Example.hasNullableString, AsyncLiteralAs.string)
    }

    public setHasNullableString(value: string | undefined): Promise<void> {
        return AsyncOptionalAs.object(this, Example.hasNullableString, value, LiteralFrom.string)
    }


    /* Set Mapping */
    public get hasChildSet(): AsyncWrappingSet<AsyncChild> {
        return AsyncSetFrom.subjectPredicate(this, Example.hasChildSet, AsyncTermAs.instance(AsyncChild), TermFrom.instance)
    }

    public get hasLangStringSet(): AsyncWrappingSet<ILangString> {
        return AsyncSetFrom.subjectPredicate(this, Example.hasLangStringSet, AsyncLiteralAs.langString, LiteralFrom.langString)
    }


    /* Recursion Mapping */
    public get hasRecursive(): Promise<AsyncParent> {
        return AsyncRequiredFrom.subjectPredicate(this, Example.hasRecursive, AsyncTermAs.instance(AsyncParent))
    }

    public setHasRecursive(value: AsyncParent | undefined): Promise<void> {
        return AsyncOptionalAs.object(this, Example.hasRecursive, value, TermFrom.instance)
    }
}
