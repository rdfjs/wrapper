import type { ILangString, TermNode } from "@rdfjs/wrapper"
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
    public get hasBlankNode(): string {
        return RequiredFrom.subjectPredicate(this.node, Example.hasBlankNode, LiteralAs.string)
    }

    public get hasDate(): Date {
        return RequiredFrom.subjectPredicate(this.node, Example.hasDate, LiteralAs.date)
    }

    public get hasLangString(): ILangString {
        return RequiredFrom.subjectPredicate(this.node, Example.hasLangString, LiteralAs.langString)
    }

    public get hasNumber(): number {
        return RequiredFrom.subjectPredicate(this.node, Example.hasNumber, LiteralAs.number)
    }

    public get hasBoolean(): boolean {
        return RequiredFrom.subjectPredicate(this.node, Example.hasBoolean, LiteralAs.boolean)
    }

    public get hasString(): string {
        return RequiredFrom.subjectPredicate(this.node, Example.hasString, LiteralAs.string)
    }

    public get hasIri(): string {
        return RequiredFrom.subjectPredicate(this.node, Example.hasIri, LiteralAs.string)
    }


    /* Term Mapping */
    public set hasBlankNode(value: string) {
        RequiredAs.object(this.node, Example.hasBlankNode, value, BlankNodeFrom.string)
    }

    public set hasDate(value: Date) {
        RequiredAs.object(this.node, Example.hasDate, value, LiteralFrom.date)
    }

    public set hasLangString(value: ILangString) {
        RequiredAs.object(this.node, Example.hasLangString, value, LiteralFrom.langString)
    }

    public set hasNumber(value: number) {
        RequiredAs.object(this.node, Example.hasNumber, value, LiteralFrom.double)
    }

    public set hasBoolean(value: boolean) {
        RequiredAs.object(this.node, Example.hasBoolean, value, LiteralFrom.boolean)
    }

    public set hasString(value: string) {
        RequiredAs.object(this.node, Example.hasString, value, LiteralFrom.string)
    }

    public set hasIri(value: string) {
        RequiredAs.object(this.node, Example.hasIri, value, NamedNodeFrom.string)
    }


    /* Object Mapping */
    public get hasChild(): Child {
        return RequiredFrom.subjectPredicate(this.node, Example.hasChild, TermAs.instance(Child))
    }

    public set hasChild(value: Child) {
        OptionalAs.object(this.node, Example.hasChild, value, TermFrom.instance)
    }


    /* Arity Mapping */
    public get hasNoSingularString(): string {
        return RequiredFrom.subjectPredicate(this.node, Example.hasNoSingularString, LiteralAs.string)
    }

    public get hasTooManySingularString(): string {
        return RequiredFrom.subjectPredicate(this.node, Example.hasTooManySingularString, LiteralAs.string)
    }

    public get hasNullableString(): string | undefined {
        return OptionalFrom.subjectPredicate(this.node, Example.hasNullableString, LiteralAs.string)
    }

    public set hasNullableString(value: string | undefined) {
        OptionalAs.object(this.node, Example.hasNullableString, value, LiteralFrom.string)
    }


    /* Set Mapping */
    public get hasChildSet(): Set<Child> {
        return SetFrom.subjectPredicate(this.node, Example.hasChildSet, TermAs.instance(Child), TermFrom.instance)
    }

    public get hasLangStringSet(): Set<ILangString> {
        return SetFrom.subjectPredicate(this.node, Example.hasLangStringSet, LiteralAs.langString, LiteralFrom.langString)
    }


    /* Recursion Mapping */
    public get hasRecursive(): Parent | undefined {
        return RequiredFrom.subjectPredicate(this.node, Example.hasRecursive, TermAs.instance(Parent))
    }

    public set hasRecursive(value: Parent | undefined) {
        OptionalAs.object(this.node, Example.hasRecursive, value, TermFrom.instance)
    }
}
