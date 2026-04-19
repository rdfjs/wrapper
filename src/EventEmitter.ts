import { BaseQuad, Quad, Term } from "@rdfjs/types";
import { IPattern } from "./dataset/LazyMaterialize.js";
import { ChangeEvent } from "./dataset/NotifyingDatasetCore.js";

export class EventEmitter<Args extends any[]> {
    private readonly listeners: Set<(...args: Args) => void> = new Set();

    on(listener: (...args: Args) => void): void {
        this.listeners.add(listener);
    }

    off(listener: (...args: Args) => void): void {
        this.listeners.delete(listener);
    }

    emit(...args: Args): void {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }

    get empty(): boolean {
        return this.listeners.size === 0;
    }
}

const KEYS = ['graph', 'subject', 'predicate', 'object'] as const;
const LAST = KEYS.length - 1;

const idxToStr = (idx: number, pattern: IPattern<any>): string => {
    return toString(pattern[KEYS[idx]!]);
}

function handleMap<IQuad extends BaseQuad>(map: Map<string, any>, idx: number, pattern: IPattern<IQuad>, listener: (event: ChangeEvent, q: IQuad) => void): void {
    const str = idxToStr(idx, pattern);
    if (!map.has(str)) {
        return;
    }
    const item: Map<string, any> | Set<(event: ChangeEvent, q: IQuad) => void> = map.get(str);

    if (idx === LAST) {
        // Leaf level: remove the specific listener, not every listener for this pattern.
        (item as Set<(event: ChangeEvent, q: IQuad) => void>).delete(listener);
    } else {
        handleMap(item as Map<string, any>, idx + 1, pattern, listener);
    }

    if (item.size === 0) {
        map.delete(str);
    }
}

function *yieldListeners<IQuad extends BaseQuad>(idx: number, pattern: IPattern<IQuad>, map: Map<string, any>): Iterable<(event: ChangeEvent, q: IQuad) => void> {
    const str = idxToStr(idx, pattern);
    const elems = str === '*' ? ['*'] : [str, '*'];

    for (const elem of elems) {
        const item: Map<string, any> | Set<(event: ChangeEvent, q: IQuad) => void> = map.get(elem);

        if (item !== undefined) {
            if (idx === LAST) {
                yield *item as Set<(event: ChangeEvent, q: IQuad) => void>;
            } else {
                yield *yieldListeners(idx + 1, pattern, item as Map<string, any>);
            }
        }
    }
}

export class PatternEventEmitter<IQuad extends BaseQuad> {
    private listeners: Map<string, any> = new Map();

    on(pattern: IPattern<IQuad>, listener: (event: ChangeEvent, q: IQuad) => void): void {
        let listenerSet: any = this.listeners;
        for (const key of KEYS) {
            const str = toString(pattern[key]);
            let next = listenerSet.get(str);
            if (next === undefined) {
                next = key === 'object' ? new Set<(event: ChangeEvent, q: IQuad) => void>() : new Map<string, any>();
                listenerSet.set(str, next);
            }
            listenerSet = next;
        }
        listenerSet.add(listener);
    }

    off(pattern: IPattern<IQuad>, listener: (event: ChangeEvent, q: IQuad) => void): void {
        handleMap(this.listeners, 0, pattern, listener);
    }

    emit(event: ChangeEvent, q: IQuad): void {
        for (const listener of yieldListeners(0, q, this.listeners)) {
            listener(event, q);
        }
    }

    get empty(): boolean {
        return this.listeners.size === 0;
    }
}

function toString(term: Term | undefined): string {
    if (!term) {
        return '*';
    }
    switch (term.termType) {
        case 'NamedNode':
            return `<${term.value}>`;
        case 'BlankNode':
            return `_:${term.value}`;
        case 'Literal':
            if (term.language) {
                return `"${term.value}"@${term.language}`;
            } else if (term.datatype && term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
                return `"${term.value}"^^<${term.datatype.value}>`;
            } else {
                return `"${term.value}"`;
            }
        case 'DefaultGraph':
            return '';
        case 'Variable':
            return `?${term.value}`;
        case 'Quad':
            return `${toString(term.subject)} ${toString(term.predicate)} ${toString(term.object)}${term.graph.termType !== 'DefaultGraph' ? ` ${toString(term.graph)}` : ''} .`;
    }
}
