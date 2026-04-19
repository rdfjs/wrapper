import { DefaultGraph, Term } from "@rdfjs/types";

/**
 * Frozen, shared singleton {@link DefaultGraph} term used internally to
 * route default-graph match calls.
 *
 * Sharing a single instance avoids allocating a new term object every time
 * a {@link DatasetWrapper} delegates a match call to its backing dataset.
 */
export const defaultGraph: DefaultGraph = Object.freeze({
    termType: "DefaultGraph",
    value: "",
    equals: (other: Term | null | undefined) => other?.termType === "DefaultGraph" && other.value === ""
});
