import type { Quad_Object, Quad_Subject } from "@rdfjs/types"
import { DatasetWrapper } from "@rdfjs/wrapper"
import { Parent } from "./Parent.js"
import { Child } from "./Child.js"
import { Example } from "../vocabulary/Example.js"

export class ParentDataset extends DatasetWrapper {
    public get instancesOfParent(): Iterable<Parent & Quad_Subject> {
        return this.instancesOf(Example.Parent, Parent)
    }

    public get subjectsOfHasChild(): Iterable<Parent & Quad_Subject> {
        return this.subjectsOf(Example.hasChild, Parent)
    }

    public get objectsOfHasChild(): Iterable<Child & Quad_Object> {
        return this.objectsOf(Example.hasChild, Child)
    }

    public get matchSubjectsOfPropertyanyObjectparentGraphany(): Iterable<Parent & Quad_Subject> {
        return this.matchSubjectsOf(Parent, undefined, this.factory.namedNode(Example.Parent), undefined)
    }

    public get matchObjectsOfSubjectxPropertyhaschildGraphany(): Iterable<Child & Quad_Object> {
        return this.matchObjectsOf(Child, this.factory.namedNode("x"), this.factory.namedNode(Example.hasChild), undefined)
    }
}
