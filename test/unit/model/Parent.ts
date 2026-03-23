import type { ILangString } from "@rdfjs/wrapper"
import { BlankNodeFrom, LiteralAs, LiteralFrom, NamedNodeFrom, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import { Child } from "./Child.js"
import { Example } from "../vocabulary/Example.js"

export class Parent extends TermWrapper {
    /* Value Mapping */
    public get hasBlankNode(): string {
        return this.singular(Example.hasBlankNode, LiteralAs.string)
    }

    public get hasDate(): Date {
        return this.singular(Example.hasDate, LiteralAs.date)
    }

    public get hasLangString(): ILangString {
        return this.singular(Example.hasLangString, LiteralAs.langString)
    }

    public get hasNumber(): number {
        return this.singular(Example.hasNumber, LiteralAs.number)
    }

    public get hasBoolean(): boolean {
        return this.singular(Example.hasBoolean, LiteralAs.boolean)
    }

    public get hasString(): string {
        return this.singular(Example.hasString, LiteralAs.string)
    }

    public get hasIri(): string {
        return this.singular(Example.hasIri, LiteralAs.string)
    }


    /* Term Mapping */
    public set hasBlankNode(value: string) {
        this.overwrite(Example.hasBlankNode, value, BlankNodeFrom.string)
    }

    public set hasDate(value: Date) {
        this.overwrite(Example.hasDate, value, LiteralFrom.date)
    }

    public set hasLangString(value: ILangString) {
        this.overwrite(Example.hasLangString, value, LiteralFrom.langString)
    }

    public set hasNumber(value: number) {
        this.overwrite(Example.hasNumber, value, LiteralFrom.double)
    }

    public set hasBoolean(value: boolean) {
        this.overwrite(Example.hasBoolean, value, LiteralFrom.boolean)
    }

    public set hasString(value: string) {
        this.overwrite(Example.hasString, value, LiteralFrom.string)
    }

    public set hasIri(value: string) {
        this.overwrite(Example.hasIri, value, NamedNodeFrom.string)
    }


    /* Object Mapping */
    public get hasChild(): Child {
        return this.singular(Example.hasChild, TermAs.instance(Child))
    }

    public set hasChild(value: Child) {
        this.overwriteNullable(Example.hasChild, value, TermFrom.instance)
    }


    /* Arity Mapping */
    public get hasNoSingularString(): string {
        return this.singular(Example.hasNoSingularString, LiteralAs.string)
    }

    public get hasTooManySingularString(): string {
        return this.singular(Example.hasTooManySingularString, LiteralAs.string)
    }

    public get hasNullableString(): string | undefined {
        return this.singularNullable(Example.hasNullableString, LiteralAs.string)
    }

    public set hasNullableString(value: string | undefined) {
        this.overwriteNullable(Example.hasNullableString, value, LiteralFrom.string)
    }


    /* Set Mapping */
    public get hasChildSet(): Set<Child> {
        return this.objects(Example.hasChildSet, TermAs.instance(Child), TermFrom.instance)
    }

    public get hasLangStringSet(): Set<ILangString> {
        return this.objects(Example.hasLangStringSet, LiteralAs.langString, LiteralFrom.langString)
    }


    /* Recursion Mapping */
    public get hasRecursive(): Parent {
        return this.singular(Example.hasRecursive, TermAs.instance(Parent))
    }

    public set hasRecursive(value: Parent | undefined) {
        this.overwriteNullable(Example.hasRecursive, value, TermFrom.instance)
    }
}
