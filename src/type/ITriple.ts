import type { BaseQuad, DefaultGraph, Quad } from "@rdfjs/types";

export interface BaseTriple extends BaseQuad {
    graph: DefaultGraph;
}

export interface Triple extends Quad {
    graph: DefaultGraph;
}
