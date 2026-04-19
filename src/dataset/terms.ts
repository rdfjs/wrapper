import { DefaultGraph, Term } from "@rdfjs/types";

export const defaultGraph: DefaultGraph = Object.freeze({
    termType: "DefaultGraph",
    value: "",
    equals: (other: Term | null | undefined) => other?.termType === "DefaultGraph" && other.value === ""
});
