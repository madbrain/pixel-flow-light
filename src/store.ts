import type { NodeGroupIO } from "@madbrain/node-graph-editor";
import {writable} from "svelte/store";
import type { Rectangle } from "./geometry";
import { example } from "./examples";

export interface CatalogImage {
    name: string;
    data: ImageData;
}

export interface ViewerModel {
    image: ImageData;
    layers: Layer[];
}

export interface Layer {
    name: string;
    marks: Rectangle[];
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

export const project = writable<Project>({ graphs: [
    { name: "Main", nodeGroup: example, selected: true, isMain: true }
] });

export const catalog = writable([]);

export const viewerContent = writable(null);

export const progressMonitor = writable(null);