import type { Term } from "@rdfjs/types"

const paths = new WeakMap<object, readonly Term[]>()

export function pathOf(o: object): readonly Term[] {
    return paths.get(o) ?? []
}

export function withPath<V>(v: V, path: readonly Term[]): V {
    if (Array.isArray(v)) {
        v.forEach(x => withPath(x, path))
    } else if (typeof v === "object" && v !== null) {
        paths.set(v, path)
    }

    return v
}
