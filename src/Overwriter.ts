import { TermWrapper } from "./TermWrapper.js"
import { ListItem } from "./ListItem.js"
import type { Term } from "@rdfjs/types"
import { TermFrom } from "./mapping/TermFrom.js"

export class Overwriter<T> extends TermWrapper {
    constructor(subject: TermWrapper, private readonly p: string) {
        super(subject as Term, subject.dataset, subject.factory);
    }

    set listNode(object: ListItem<T>) {
        this.overwrite(this.p, object, TermFrom.instance)
    }
}
