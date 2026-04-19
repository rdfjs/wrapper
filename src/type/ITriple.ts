import type { BaseQuad, DefaultGraph, Quad } from "@rdfjs/types";

export interface IBaseTriple extends BaseQuad {
    graph: DefaultGraph;
}

export interface ITriple extends Quad {
    graph: DefaultGraph;
}
