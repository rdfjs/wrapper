import type { Quad } from "@rdfjs/types"

/**
 * Represents the function signature of callbacks that observe changes to the contents of an {@link AsyncDatasetWrapper}.
 *
 * Used by this library where lambdas are accepted for reacting to quads being added to or removed from the underlying asynchronous data.
 *
 * @remarks
 * - Listeners are invoked once per quad that is effectively added or removed, regardless of whether the change was performed directly on the {@link AsyncDatasetWrapper} or indirectly through a mapped property.
 * - Listeners may be asynchronous: a returned {@link Promise} is awaited before the next listener is invoked, and the promise returned by the mutation that triggered the notification only resolves once every listener has settled.
 * - No restrictions are imposed on what listeners do with the notifications, except for the understanding that mutating the dataset from within a listener triggers further notifications.
 *
 * @param event - The type of the change: `"add"` when a quad was added to the dataset, `"delete"` when one was removed.
 * @param quad - The quad that was added to or removed from the dataset.
 *
 * @example Listener as asynchronous TypeScript function
 * ```ts
 * async function listener(event: "add" | "delete", quad: Quad): Promise<void> {
 *   await audit.record(event, quad)
 * }
 * ```
 *
 * @example Listener as JavaScript function
 * ```js
 * function listener(event, quad) {
 *   console.log(`${event} ${quad.object.value}`)
 * }
 * ```
 *
 * @example Listener as TypeScript typed constant
 * Authoring listeners as typed TypeScript constants helps by compile-time checking that a lambda adheres to the interface.
 * ```ts
 * const listener: IAsyncDatasetChangeListener = (event, quad) => console.log(`${event} ${quad.object.value}`)
 * ```
 *
 * @see
 * - {@link AsyncDatasetWrapper.on}
 * - {@link AsyncDatasetWrapper.off}
 * - {@link Quad}
 */
export interface IAsyncDatasetChangeListener {
    (event: "add" | "delete", quad: Quad): void | Promise<void>
}
