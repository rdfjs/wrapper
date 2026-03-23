import { TermWrapper } from "../TermWrapper.js"
import type { Term } from "@rdfjs/types"
import { TermTypeError } from "../errors/TermTypeError.js"
import { LiteralDatatypeError } from "../errors/LiteralDatatypeError.js"
import type { ITermWrapperConstructor } from "../type/ITermWrapperConstructor.js"
import type { ITermAsValueMapping } from "../type/ITermAsValueMapping.js"
import type { ITermFromValueMapping } from "../type/ITermFromValueMapping.js"
import { RdfList } from "../RdfList.js"

/**
 * A collection of {@link ITermAsValueMapping | mappers} that convert RDF terms to JavaScript constructs.
 */
export namespace TermAs {
    export function instance<T>(constructor: ITermWrapperConstructor<T>): ITermAsValueMapping<T> {
        return (termWrapper: TermWrapper) => new constructor(termWrapper as Term, termWrapper.dataset, termWrapper.factory)
    }

    export function is<T extends TermWrapper>(term: T): T {
        return term
    }

    export function list<T>(subject: TermWrapper, predicate: string, termAs: ITermAsValueMapping<T>, termFrom: ITermFromValueMapping<T>): ITermAsValueMapping<T[]> {
        return w => new RdfList(w as Term, subject, predicate, termAs, termFrom)
    }

    export function term(term: TermWrapper): Term {
        return term as Term
    }
}

function ensurePresent(term: any) {
    if (term === undefined || term === null) {
        throw new ReferenceError("Term cannot be null or undefined")
    }
}

function ensureType(term: any) {
    if (!(term instanceof TermWrapper)) {
        throw new TypeError("Term must be a TermWrapper")
    }
}

function ensureLiteral(term: TermWrapper) {
    if (term.termType !== "Literal") {
        throw new TermTypeError(term as Term, "Literal")
    }
}

function ensureDatatype(term: TermWrapper, ...datatypes: string[]) {
    if (!datatypes.includes(term.datatype.value)) {
        throw new LiteralDatatypeError(term as Term, datatypes)
    }
}
