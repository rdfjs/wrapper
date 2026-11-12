import type { Term } from "@rdfjs/types"

const paths = new WeakMap<object, readonly Term[]>()

export function pathOf(value: object): readonly Term[] {
    return paths.get(value) ?? []
}

export function withPath<T>(value: T, path: readonly Term[]): T {
    if (Array.isArray(value)) {
        for (const element of value) {
            withPath(element, path)
        }
    } else if (typeof value === "object" && value !== null) {
        paths.set(value, path)
    }

    return value
}
