
import type { NodeGroupIO } from "@madbrain/node-graph-editor";
import type { Point, Rectangle } from "./geometry";

export interface CatalogImage {
    name: string;
    data: ImageData;
}

export interface ViewerModel {
    image: ImageData;
    layers: Layer[];
}

export interface Line {
    from: Point;
    to: Point;
}

export interface Layer {
    name: string;
    marks: Rectangle[];
    lines: Line[];
}

export interface Graph {
    name: string;
    nodeGroup: NodeGroupIO;
    selected?: boolean;
    isMain?: boolean;
}

export interface Project {
    graphs: Graph[];
}