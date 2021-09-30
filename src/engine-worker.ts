
import type { NodeGroup } from "@madbrain/node-graph-editor";
import { Engine, ProgressMonitor } from "./engine";
import { Globals, nodeFactory } from "./nodes";
import type { CatalogImage, ViewerModel } from "./store";

declare function postMessage(message: any, transferables?: Transferable[]);

class EngineGlobals implements Globals {
    catalog: CatalogImage[] = [];
    getImages(): CatalogImage[] {
        return this.catalog;
    }
    setViewer(content: ViewerModel) {
        postMessage({ type: "update-viewer", content } /*, [content.image.data.buffer] */);
    }
}

class EngineProgressListener implements ProgressMonitor {
    start() {
        postMessage({ type: "start-progress" });
    }
    progress(amount: number, message: string) {
        postMessage({ type: "in-progress", amount, message });
    }
    end() {
        postMessage({ type: "end-progress" });
    }
}

const globals = new EngineGlobals();
const engine = new Engine(globals, new EngineProgressListener());

addEventListener("message", (message: MessageEvent<any>) => {
    if (message.data.type == "graph") {
        const graph: NodeGroup = nodeFactory.load(message.data.graph);
        const previews = engine.update(graph);
        postMessage({ type: "previews", previews });
    } else if (message.data.type == "catalog") {
        globals.catalog = message.data.catalog;
    } else {
        console.log("WORKER: message", message.data);
    }
});
    
console.log("Engine worker started");