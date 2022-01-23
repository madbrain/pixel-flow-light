
import type { Previews } from "./engine";
import type { Rectangle } from "./geometry";
import type { Preview } from "./nodes";
import type { CatalogImage, Project } from "./api";
import { catalog, viewerContent, progressMonitor} from "./store";

export class EngineInterface {
    worker: Worker;
    internalCanvas: HTMLCanvasElement;
    internalContext: CanvasRenderingContext2D;

    constructor(private editor: any) {
        this.worker = new Worker('./engine-worker.js');
        this.worker.onmessage = ev => {
            if (ev.data.type == "previews") {
                const previews: Previews = ev.data.previews;
                editor.updatePreviews(this.processPreviews(previews));
            } else if (ev.data.type == "update-viewer") {
                viewerContent.set(ev.data.content);
            } else if (ev.data.type == "start-progress") {
                progressMonitor.set({ visible: true });
            } else if (ev.data.type == "in-progress") {
                progressMonitor.set({ visible: true, amount: ev.data.amount, message: ev.data.message });
            } else if (ev.data.type == "end-progress") {
                progressMonitor.set({ visible: false });
            } else {
                console.log("Engine message", ev.data);
            }
        };
        catalog.subscribe((images: CatalogImage[]) => {
            this.worker.postMessage({ type: "catalog", catalog: images });
        });
        this.internalCanvas = document.createElement("canvas");
        this.internalContext = this.internalCanvas.getContext("2d"); 
    }

    update(project: Project) {
        this.worker.postMessage({ type: "project", project: project });
    }

    private processPreviews(previews: Previews): { [key: string]: ImageData } {
        const result = {};
        for (let image in previews) {
            const preview = this.processPreview(previews[image]);
            if (preview) {
                result[image] = preview;
            }
        }
        return result;
    }

    private processPreview(preview: Preview): ImageData {
        
        if (preview.type == "chart-preview") {
            const values: number[] = (<any>preview).values;
            this.internalCanvas.width = 500;
            this.internalCanvas.height = 500;
            this.internalContext.clearRect(0, 0, 500, 500);
            const step = 500 / values.length;
            let max = 0;
            for (let i = 0; i < values.length; ++i) {
                max = Math.max(max, values[i]);
            }
            this.internalContext.fillStyle = "#4a83fd";
            this.internalContext.beginPath();
            this.internalContext.moveTo(0, 500);
            for (let i = 0; i < values.length; ++i) {
                const height = 500 * values[i] / max;
                this.internalContext.lineTo(i*step, 500 - height);
            }
            this.internalContext.closePath();
            this.internalContext.fill();
            return this.internalContext.getImageData(0, 0, 500, 500);
        }
        if (preview.type == "viewer-preview") {
            const inputImage: ImageData = (<any>preview).inputImage;
            const marks: Rectangle[] = (<any>preview).marks;
            this.internalCanvas.width = inputImage.width;
            this.internalCanvas.height = inputImage.height;
            this.internalContext.clearRect(0, 0, inputImage.width, inputImage.height);
            this.internalContext.putImageData(inputImage, 0, 0);
            this.internalContext.strokeStyle = "#0000FF";
            for (let i = 0; i < marks.length; ++i) {
                const r = marks[i];
                this.internalContext.beginPath();
                this.internalContext.rect(r.x, r.y, r.width, r.height);
                this.internalContext.closePath();
                this.internalContext.stroke();
            }
            return this.internalContext.getImageData(0, 0, inputImage.width, inputImage.height);
        }
        if (preview.type == "image-preview") {
            return (<any>preview).image;
        }
        console.log("UNKNOWN PREVIEW", preview.type);
        return null;
    }
}