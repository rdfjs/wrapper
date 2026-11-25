import type { ILangString } from "@rdfjs/wrapper"
import {
    BlankNodeFrom,
    LiteralAs,
    LiteralFrom,
    NamedNodeFrom,
    OptionalAs,
    OptionalFrom,
    RequiredAs,
    RequiredFrom,
    SetFrom,
    TermAs,
    TermFrom,
    TermWrapper
} from "@rdfjs/wrapper"
import { Child } from "./Child.js"
import { Example } from "../vocabulary/Example.js"

export class Parent extends TermWrapper {
    /* Value Mapping */
    public get hasBigint(): bigint {
        return RequiredFrom.subjectPredicate(this, Example.hasBigint, LiteralAs.bigint)
    }

    public get hasBlankNode(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasBlankNode, LiteralAs.string)
    }

    public get hasDate(): Date {
        return RequiredFrom.subjectPredicate(this, Example.hasDate, LiteralAs.date)
    }

    public get hasLangString(): ILangString {
        return RequiredFrom.subjectPredicate(this, Example.hasLangString, LiteralAs.langString)
    }

    public get hasNumber(): number {
        return RequiredFrom.subjectPredicate(this, Example.hasNumber, LiteralAs.number)
    }

    public get hasBoolean(): boolean {
        return RequiredFrom.subjectPredicate(this, Example.hasBoolean, LiteralAs.boolean)
    }

    public get hasString(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasString, LiteralAs.string)
    }

    public get hasIri(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasIri, LiteralAs.string)
    }

    public get hasSymbol(): symbol {
        return RequiredFrom.subjectPredicate(this, Example.hasSymbol, LiteralAs.symbol)
    }


    /* Term Mapping */
    public set hasBigint(value: bigint) {
        RequiredAs.object(this, Example.hasBigint, value, LiteralFrom.bigint)
    }

    public set hasBlankNode(value: string) {
        RequiredAs.object(this, Example.hasBlankNode, value, BlankNodeFrom.string)
    }

    public set hasDate(value: Date) {
        RequiredAs.object(this, Example.hasDate, value, LiteralFrom.date)
    }

    public set hasLangString(value: ILangString) {
        RequiredAs.object(this, Example.hasLangString, value, LiteralFrom.langString)
    }

    public set hasNumber(value: number) {
        RequiredAs.object(this, Example.hasNumber, value, LiteralFrom.double)
    }

    public set hasBoolean(value: boolean) {
        RequiredAs.object(this, Example.hasBoolean, value, LiteralFrom.boolean)
    }

    public set hasString(value: string) {
        RequiredAs.object(this, Example.hasString, value, LiteralFrom.string)
    }

    public set hasIri(value: string) {
        RequiredAs.object(this, Example.hasIri, value, NamedNodeFrom.string)
    }

    public set hasSymbol(value: symbol) {
        RequiredAs.object(this, Example.hasSymbol, value, LiteralFrom.symbol)
    }


    /* Object Mapping */
    public get hasChild(): Child {
        return RequiredFrom.subjectPredicate(this, Example.hasChild, TermAs.instance(Child))
    }

    public set hasChild(value: Child) {
        OptionalAs.object(this, Example.hasChild, value, TermFrom.instance)
    }


    /* Arity Mapping */
    public get hasNoSingularString(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasNoSingularString, LiteralAs.string)
    }

    public get hasTooManySingularString(): string {
        return RequiredFrom.subjectPredicate(this, Example.hasTooManySingularString, LiteralAs.string)
    }

    public get hasNullableString(): string | undefined {
        return OptionalFrom.subjectPredicate(this, Example.hasNullableString, LiteralAs.string)
    }

    public set hasNullableString(value: string | undefined) {
        OptionalAs.object(this, Example.hasNullableString, value, LiteralFrom.string)
    }


    /* Set Mapping */
    public get hasChildSet(): Set<Child> {
        return SetFrom.subjectPredicate(this, Example.hasChildSet, TermAs.instance(Child), TermFrom.instance)
    }

    public get hasLangStringSet(): Set<ILangString> {
        return SetFrom.subjectPredicate(this, Example.hasLangStringSet, LiteralAs.langString, LiteralFrom.langString)
    }


    /* Recursion Mapping */
    public get hasRecursive(): Parent {
        return RequiredFrom.subjectPredicate(this, Example.hasRecursive, TermAs.instance(Parent))
    }

    public set hasRecursive(value: Parent | undefined) {
        OptionalAs.object(this, Example.hasRecursive, value, TermFrom.instance)
    }
}
