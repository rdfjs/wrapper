import { AsyncDatasetWrapper } from "@rdfjs/wrapper"
import { AsyncParent } from "./AsyncParent.js"
import { AsyncChild } from "./AsyncChild.js"
import { Example } from "../vocabulary/Example.js"

export class AsyncParentDataset extends AsyncDatasetWrapper {
    public get instancesOfParent(): AsyncIterable<AsyncParent> {
        return this.instancesOf(Example.Parent, AsyncParent)
    }

    public get subjectsOfHasChild(): AsyncIterable<AsyncParent> {
        return this.subjectsOf(Example.hasChild, AsyncParent)
    }

    public get objectsOfHasChild(): AsyncIterable<AsyncChild> {
        return this.objectsOf(Example.hasChild, AsyncChild)
    }

    public get matchSubjectsOfPropertyanyObjectparentGraphany(): AsyncIterable<AsyncParent> {
        return this.matchSubjectsOf(AsyncParent, undefined, this.factory.namedNode(Example.Parent))
    }

    public get matchObjectsOfSubjectxPropertyhaschildGraphany(): AsyncIterable<AsyncChild> {
        return this.matchObjectsOf(AsyncChild, this.factory.namedNode("x"), this.factory.namedNode(Example.hasChild))
    }
}
