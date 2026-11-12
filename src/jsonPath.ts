import type { Term } from "@rdfjs/types"

/**
 * A side table that holds, for a value that is about to be serialized to JSON, the terms of the wrappers that contain it (its ancestors, outermost first).
 *
 * @remarks
 * {@link JSON.stringify} finds circular structures with a stack of the objects it is currently inside. A `toJSON` method cannot see that stack (it receives only the property key), and the stack compares objects by identity, which never matches here because each read of a mapped property creates a new wrapper for the same node. The `toJSON` methods of this library therefore keep an equivalent stack themselves: each one gives its own path to the values it returns (see {@link withPath}), and each of those values reads that path back when {@link JSON.stringify} descends into it (see {@link pathOf}).
 *
 * The path is an ancestor path and not a set of all visited nodes, because a node that occurs more than once is circular only if it occurs inside itself. A node that is shared by two branches is serialized in full in each of them, exactly as {@link JSON.stringify} does with a shared object.
 *
 * There is one path per value and not one global stack, because `toJSON` is called when {@link JSON.stringify} enters a value but nothing is called when it leaves, so a global stack could never be popped. Paths are never mutated, so sibling values share one array.
 *
 * The path is kept in this table and not in a property of the value so that it does not appear in the output, also works for frozen objects and does not change objects that belong to the caller. The keys are held weakly, so an entry is removed together with its value.
 */
const paths = new WeakMap<object, readonly Term[]>()

/**
 * Gets the ancestor path of a value that is being serialized to JSON.
 *
 * @param value The value whose `toJSON` method is running.
 * @returns The terms of the wrappers that contain the value, outermost first. Empty if the value is the root of the serialization (or `toJSON` was called directly on a value that was not returned by another `toJSON` of this library).
 */
export function pathOf(value: object): readonly Term[] {
    return paths.get(value) ?? []
}

/**
 * Records the ancestor path of a value that a `toJSON` method is about to return to {@link JSON.stringify}.
 *
 * @remarks
 * Arrays are not recorded themselves. {@link JSON.stringify} descends into an array without calling any `toJSON`, so the path is passed on to the elements instead. Primitives are ignored because they cannot contain anything.
 *
 * @param value The value to record the path of.
 * @param path The terms of the wrappers that contain the value, outermost first.
 * @returns The same value, so that calls can be used inline.
 */
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
