import {writable} from "svelte/store";
import type { Rectangle } from "./geometry";

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

export const graph = writable({ nodes: [] });

export const catalog = writable([]);

export const viewerContent = writable(null);

export const progressMonitor = writable(null);