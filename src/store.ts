import {writable} from "svelte/store";
import type { Project } from "./api";
import { exampleProject } from "./examples";

export const project = writable<Project>(exampleProject);

export const catalog = writable([]);

export const viewerContent = writable(null);

export const progressMonitor = writable(null);