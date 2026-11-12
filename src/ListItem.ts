import { TermWrapper } from "./TermWrapper.js"
import type { DataFactory, DatasetCore, Term } from "@rdfjs/types"
import { RDF } from "./vocabulary/RDF.js"
import type { ITermAsValueMapping } from "./type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "./type/ITermFromValueMapping.js"
import { TermAs } from "./mapping/TermAs.js"
import { TermFrom } from "./mapping/TermFrom.js"
import { RequiredFrom } from "./mapping/RequiredFrom.js"
import { OptionalFrom } from "./mapping/OptionalFrom.js"
import { OptionalAs } from "./mapping/OptionalAs.js"
import { RequiredAs } from "./mapping/RequiredAs.js"

export class ListItem<T> extends TermWrapper {
    constructor(term: Term, dataset: DatasetCore, factory: DataFactory, private readonly termAs: ITermAsValueMapping<T>, private readonly termFrom: ITermFromValueMapping<T>) {
        super(term, dataset, factory)
    }

    public get firstRaw(): Term | undefined {
        return OptionalFrom.subjectPredicate(this, RDF.first, TermAs.term)
    }

    public set firstRaw(value: Term | undefined) {
        OptionalAs.object(this, RDF.first, value, TermFrom.itself)
    }

    public get restRaw(): Term | undefined {
        return OptionalFrom.subjectPredicate(this, RDF.rest, TermAs.term)
    }

    public set restRaw(value: Term | undefined) {
        OptionalAs.object(this, RDF.rest, value, TermFrom.itself)
    }

    public get isListItem(): boolean {
        return this.firstRaw !== undefined && this.restRaw !== undefined
    }

    public get isNil(): boolean {
        return this.equals(this.factory.namedNode(RDF.nil))
    }

    public get first(): T {
        return RequiredFrom.subjectPredicate(this, RDF.first, this.termAs)
    }

    public set first(value: T) {
        RequiredAs.object(this, RDF.first, value, this.termFrom)
    }

    public get rest(): ListItem<T> {
        return RequiredFrom.subjectPredicate(this, RDF.rest, (w: TermWrapper) => new ListItem(w as Term, w.dataset, w.factory, this.termAs, this.termFrom))
    }

    public set rest(value: ListItem<T>) {
        RequiredAs.object(this, RDF.rest, value, TermFrom.instance)
    }

    public pop(): T {
        try {
            return this.first
        } finally {
            this.firstRaw = undefined
            this.restRaw = this.factory.namedNode(RDF.nil)
        }
    }

    public* items(): Iterable<ListItem<T>> {
        if (this.firstRaw === undefined) {
            return
        }

        yield this

        for (const more of this.rest.items()) {
            yield more
        }
    }
}
