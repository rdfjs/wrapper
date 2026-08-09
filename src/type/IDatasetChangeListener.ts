import type { Quad } from "@rdfjs/types"

/**
 * The type of change to the contents of a dataset reported to an {@link IDatasetChangeListener}: `"add"` when a quad was added to the dataset, `"delete"` when a quad was removed from it.
 *
 * @see
 * - {@link DatasetWrapper.on}
 * - {@link DatasetWrapper.off}
 */
export type ChangeEvent = "add" | "delete"

/**
 * Represents the function signature of callbacks that observe changes to the contents of a {@link DatasetWrapper}.
 *
 * Used by this library where lambdas are accepted for reacting to quads being added to or removed from the underlying data.
 *
 * @remarks
 * - Listeners are invoked synchronously, once per quad that is effectively added or removed, regardless of whether the change was performed directly on the {@link DatasetWrapper} or indirectly through a mapped property.
 * - No restrictions are imposed on what listeners do with the notifications, except for the understanding that mutating the dataset from within a listener triggers further notifications.
 *
 * @param event - The type of the change: `"add"` or `"delete"`.
 * @param quad - The quad that was added to or removed from the dataset.
 *
 * @example Listener as TypeScript function
 * ```ts
 * function listener(event: ChangeEvent, quad: Quad): void {
 *   console.log(`${event} ${quad.object.value}`)
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
 * const listener: IDatasetChangeListener = (event, quad) => console.log(`${event} ${quad.object.value}`)
 * ```
 *
 * @see
 * - {@link DatasetWrapper.on}
 * - {@link DatasetWrapper.off}
 * - {@link Quad}
 */
export interface IDatasetChangeListener {
    (event: ChangeEvent, quad: Quad): void
}
