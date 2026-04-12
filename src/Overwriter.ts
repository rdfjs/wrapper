import { TermWrapper } from "./TermWrapper.js"
import type { TermNode } from "./TermWrapper.js"
import { ListItem } from "./ListItem.js"
import type { Term } from "@rdfjs/types"
import { TermFrom } from "./mapping/TermFrom.js"
import { RequiredAs } from "./mapping/RequiredAs.js"

export class Overwriter<T> extends TermWrapper {
    constructor(subject: TermNode, private readonly p: string) {
        super(subject as Term, subject.dataset, subject.factory);
    }

    set listNode(object: ListItem<T>) {
        RequiredAs.object(this.node, this.p, object, TermFrom.instance)
    }
}
