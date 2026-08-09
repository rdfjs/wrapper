import type { BaseQuad, Quad, Term } from "@rdfjs/types";
import type { IPattern } from "./dataset/LazyMaterialize.js";
import type { ChangeEvent } from "./dataset/NotifyingDatasetCore.js";

/**
 * A minimal multi-cast event emitter generic over the listener argument
 * tuple `Args`. Listeners attached with {@link on} are invoked, in
 * insertion order, on every {@link emit} call until detached with
 * {@link off}.
 *
 * Used internally to back the change-notification stream of
 * {@link NotifyingDatasetCoreWrapper} and {@link ProjectedDatasetCoreWrapper},
 * but exported because consumer-level wrappers may find it useful.
 *
 * @example Subscribing to dataset changes
 * ```ts
 * const ee = new EventEmitter<[ChangeEvent, Triple]>()
 * const listener = (event, quad) => console.log(event, quad.object.value)
 * ee.on(listener)
 * ee.emit("add", someQuad)
 * ee.off(listener)
 * ```
 */
export class EventEmitter<Args extends any[]> {
    private readonly listeners: Set<(...args: Args) => void> = new Set();

    /** Adds `listener` to the set of subscribers. Re-adding the same listener has no effect. */
    on(listener: (...args: Args) => void): void {
        this.listeners.add(listener);
    }

    /** Removes `listener` from the set of subscribers. Removing an unknown listener is a no-op. */
    off(listener: (...args: Args) => void): void {
        this.listeners.delete(listener);
    }

    /** Synchronously invokes every registered listener with `args`, in insertion order. */
    emit(...args: Args): void {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }

    /** `true` when no listeners are attached. */
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

/**
 * An event emitter that dispatches quad change events according to a
 * subscribed quad pattern.
 *
 * Subscribers register an {@link IPattern} along with their listener;
 * calling {@link emit} delivers the event only to those listeners whose
 * pattern matches the emitted quad. A field omitted (`undefined`) from
 * the pattern acts as a wildcard for that position, matching any term.
 *
 * Used internally by {@link LazyMatchNotifyingDatasetCore} to dispatch
 * pattern-filtered change notifications without re-scanning the full
 * listener list on every event.
 *
 * @example Subscribing to changes for a specific subject + predicate
 * ```ts
 * const ee = new PatternEventEmitter<Quad>()
 * ee.on({ subject: aliceTerm, predicate: hasChildTerm }, (event, quad) => {
 *     console.log(event, quad.object.value)
 * })
 * ee.emit("add", aliceHasBobQuad)   // delivered (matches subject + predicate)
 * ee.emit("add", bobHasCarolQuad)   // not delivered (subject differs)
 * ```
 */
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
