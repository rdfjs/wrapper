import type { ILangString } from "@rdfjs/wrapper"
import { TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper"
import { Child } from "./Child.js"
import { Example } from "../vocabulary/Example.js"

export class Parent extends TermWrapper {
    /* Value Mapping */
    public get hasBlankNode(): string {
        return this.singular(Example.hasBlankNode, TermAs.string)
    }

    public get hasDate(): Date {
        return this.singular(Example.hasDate, TermAs.date)
    }

    public get hasLangString(): ILangString {
        return this.singular(Example.hasLangString, TermAs.langString)
    }

    public get hasNumber(): number {
        return this.singular(Example.hasNumber, TermAs.number)
    }

    public get hasBoolean(): boolean {
        return this.singular(Example.hasBoolean, TermAs.boolean)
    }

    public get hasString(): string {
        return this.singular(Example.hasString, TermAs.string)
    }

    public get hasIri(): string {
        return this.singular(Example.hasIri, TermAs.string)
    }


    /* Term Mapping */
    public set hasBlankNode(value: string) {
        this.overwrite(Example.hasBlankNode, value, TermFrom.blankNodeLabel)
    }

    public set hasDate(value: Date) {
        this.overwrite(Example.hasDate, value, TermFrom.date)
    }

    public set hasLangString(value: ILangString) {
        this.overwrite(Example.hasLangString, value, TermFrom.langString)
    }

    public set hasNumber(value: number) {
        this.overwrite(Example.hasNumber, value, TermFrom.double)
    }

    public set hasBoolean(value: boolean) {
        this.overwrite(Example.hasBoolean, value, TermFrom.boolean)
    }

    public set hasString(value: string) {
        this.overwrite(Example.hasString, value, TermFrom.string)
    }

    public set hasIri(value: string) {
        this.overwrite(Example.hasIri, value, TermFrom.namedString)
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
        return this.singular(Example.hasNoSingularString, TermAs.string)
    }

    public get hasTooManySingularString(): string {
        return this.singular(Example.hasTooManySingularString, TermAs.string)
    }

    public get hasNullableString(): string | undefined {
        return this.singularNullable(Example.hasNullableString, TermAs.string)
    }

    public set hasNullableString(value: string | undefined) {
        this.overwriteNullable(Example.hasNullableString, value, TermFrom.string)
    }


    /* Set Mapping */
    public get hasChildSet(): Set<Child> {
        return this.objects(Example.hasChildSet, TermAs.instance(Child), TermFrom.instance)
    }

    public get hasLangStringSet(): Set<ILangString> {
        return this.objects(Example.hasLangStringSet, TermAs.langString, TermFrom.langString)
    }


    /* Recursion Mapping */
    public get hasRecursive(): Parent {
        return this.singular(Example.hasRecursive, TermAs.instance(Parent))
    }

    public set hasRecursive(value: string | undefined) {
        this.overwriteNullable(Example.hasRecursive, value, TermMapping.stringToIri)
    }
}
