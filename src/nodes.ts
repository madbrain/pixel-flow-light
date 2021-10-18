
import { CommonValueType, NodeDefinition, PropertyType, ValueDefinition, GraphicalHelper,
    Color, NodeProperty, PropertyHandler, getDefaultPropertyHandler, Node, Editor, State,
    Renderer, Point, rgb, Align, Event, NodePropertyView, IdleState, ChangePropertyValueCommand, NodeFactory} from "@madbrain/node-graph-editor";
import { processOutlines } from "./ocr/blob";
import { Block } from "./ocr/block";
import { argmax, binarization, buildHistogram, distanceImage, otsuLevels, toGrayscale } from "./compute";
import { pointAt, Rectangle } from "./geometry";
import { ImageMode } from "./ocr/image";
import { MarchingSquare } from "./ocr/marching-square";
import type { CatalogImage, Layer, ViewerModel } from "./store";
import { catalog } from "./store";

export interface Globals {
    getImages(): CatalogImage[];
    setViewer(content: ViewerModel);
}

enum PixelFlowValueType {
    COLOR = "color",
    IMAGE = "image",
    ARRAY = "array",
    CATALOG_IMAGE = "catalog-image"
}

const STRING: ValueDefinition = {
    type: CommonValueType.STRING
};

const IMAGE: ValueDefinition = {
    type: PixelFlowValueType.IMAGE
};

const ARRAY: ValueDefinition = {
    type: PixelFlowValueType.ARRAY
};

const CATALOG_IMAGE: ValueDefinition = {
    type: PixelFlowValueType.CATALOG_IMAGE
};

export interface Preview {
    type: string;
}

export interface EvaluationResult {
    outputs: { [id: string]: any };
    preview?: Preview;
}

export interface Processor {
    nodeDefinition: NodeDefinition;
    evaluate(inputs: {[id: string]: any}, globals?: Globals): EvaluationResult;
}

const inputsProcessor = {
    nodeDefinition: {
        id: "inputs",
        label: "Inputs",
        categories: "io",
        properties: [] // TODO find a way to edit properties
    },
    evaluate: (inputs: {[id: string]: any}, globals: Globals) => {
        const outputs = {};
        let preview = undefined;
        return { outputs, preview };
    }
}

const outputsProcessor = {
    nodeDefinition: {
        id: "outputs",
        label: "Outputs",
        categories: "io",
        properties: [] // TODO find a way to edit properties
    },
    evaluate: (inputs: {[id: string]: any}, globals: Globals) => {
        const outputs = {};
        let preview = undefined;
        return { outputs, preview };
    }
}

const inputImageProcessor = {
    nodeDefinition: {
        id: "image-input",
        label: "Image Input",
        preview: true,
        categories: "io",
        properties: [
            {
                id: 'image',
                label: 'Image',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'name',
                label: 'Name',
                type: PropertyType.INPUT,
                editable: true,
                linkable: false,
                valueType: CATALOG_IMAGE
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}, globals: Globals) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["name"]) {
            const catalogImage = globals.getImages().find(image => image.name == inputs["name"]);
            if (catalogImage) {
                outputs["image"] = catalogImage.data;
                preview = { type: "image-preview", image: outputs["image"] };
            }
        }
        return { outputs, preview };
    }
};

const viewerProcessor = {
    nodeDefinition: {
        id: "viewer",
        label: "Viewer",
        preview: true,
        categories: "io",
        properties: [
            {
                id: 'image',
                label: 'Image',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'marks',
                label: 'Marks',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: ARRAY
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}, globals: Globals) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["image"]) {
            const inputImage = <ImageData>inputs["image"];
            let layers: Layer[] = [];
            let marks: Rectangle[] = [];
            if (inputs["marks"]) {
                let input = <any>inputs["marks"];
                function newLayer(name: string, boxes: Rectangle[]) {
                    marks.push(...boxes);
                    layers.push({ name: name, marks: boxes }); 
                }
                
                if (input.outlines) {
                    newLayer("outlines", input.outlines.map(b => b.bounds))
                } else {
                    const block = <Block>input;
                    newLayer("blobs", block.blobs.map(b => b.boundingBox()));
                    newLayer("noises", block.noises.map(b => b.boundingBox()));
                    newLayer("smalls", block.smalls.map(b => b.boundingBox()));
                    newLayer("larges", block.larges.map(b => b.boundingBox())); 
                }
            }
            globals.setViewer({ image: inputImage, layers });

            preview = { type: "viewer-preview", inputImage, marks };
        }
        return { outputs, preview };
    }
};

const chartViewerProcessor = {
    nodeDefinition: {
        id: "chart-viewer",
        label: "Chart Viewer",
        preview: true,
        categories: "io",
        properties: [
            {
                id: 'values',
                label: 'Values',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: ARRAY
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["values"]) {
            const values = <number[]>inputs["values"];
            preview = { type: "chart-preview", values };
        }
        return { outputs, preview };
    }
};

const grayscaleProcessor = {
    nodeDefinition: {
        id: "grayscale",
        label: "Grayscale",
        categories: "color",
        properties: [
            {
                id: 'output',
                label: 'Output',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'input',
                label: 'Input',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["input"]) {
            outputs["output"] = toGrayscale(inputs["input"]);
        }
        return { outputs, preview };
    }
};

const histogramProcessor = {
    nodeDefinition: {
        id: "histogram",
        label: "Histogram",
        categories: "analysis",
        properties: [
            {
                id: 'histogram',
                label: 'Histogram',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: ARRAY
            },
            {
                id: 'image',
                label: 'Image',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["image"]) {
            outputs["histogram"] = buildHistogram(inputs["image"]);
        }
        return { outputs, preview };
    }
};

const marchingSquareProcessor = {
    nodeDefinition: {
        id: "marching-squares",
        label: "Marching Squares",
        categories: "segmentation",
        properties: [
            {
                id: 'outlines',
                label: 'Outlines',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: ARRAY
            },
            {
                id: 'image',
                label: 'Image',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["image"]) {
            const inputImage = inputs["image"];
            const image = {
                width: inputImage.width,
                height: inputImage.height,
                mode: ImageMode.BINARY,
                getPixel(x, y) {
                    return inputImage.data[(y*inputImage.width + x)*4];
                }
            };
            const rect = pointAt(0, 0).rect(inputImage.width, inputImage.height);
            const outlines = new MarchingSquare(image, rect).process();

            outputs["outlines"] = { bounds: rect, outlines };
        }
        return { outputs, preview };
    }
};

const blobHierarchyProcessor: Processor = {
    nodeDefinition: {
        id: "blob-hierarchy",
        label: "Blob Hierarchy",
        categories: "segmentation",
        properties: [
            {
                id: 'blobs',
                label: 'Blobs',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: { type: "any" }
            },
            {
                id: 'outlines',
                label: 'Outlines',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: { type: "any" }
            },
            {
                id: 'filter-blobs',
                label: 'Filter Blobs',
                type: PropertyType.INPUT,
                linkable: false,
                editable: true,
                valueType: { type: CommonValueType.BOOLEAN },
                defaultValue: false
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["outlines"]) {
            const input = inputs["outlines"];

            // TODO process or make a separate node ?
            const block = new Block(input.bounds);
            processOutlines(block, input.outlines);

            if (inputs["filter-blobs"]) {
                block.filterBlobs();
            }

            outputs["blobs"] = block;
        }
        return { outputs, preview };
    }
};

const otsuLevelsProcessor = {
    nodeDefinition: {
        id: "otsu-levels",
        label: "Otsu Levels",
        categories: "binarize",
        properties: [
            {
                id: 'levels',
                label: 'Levels',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: ARRAY
            },
            {
                id: 'histogram',
                label: 'Histogram',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: ARRAY
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["histogram"]) {
            outputs["levels"] = otsuLevels(inputs["histogram"]);
        }
        return { outputs, preview };
    }
};

const binarizationProcessor: Processor = {
    nodeDefinition: {
        id: "binarization",
        label: "Binarization",
        categories: "binarize",
        properties: [
            {
                id: 'output',
                label: 'Output',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'input',
                label: 'Input',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'level',
                label: 'Level',
                type: PropertyType.INPUT,
                linkable: true,
                editable: true,
                defaultValue: 128,
                valueType: {
                    type: CommonValueType.INTEGER,
                    range: {
                        min: 0,
                        max: 255
                    }
                }
            },
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["input"] && inputs["level"] != undefined) {
            outputs["output"] = binarization(inputs["input"], inputs["level"]);
        }
        return { outputs, preview };
    }
};

const distanceProcessor: Processor = {
    nodeDefinition: {
        id: "distance",
        label: "Distance",
        categories: "analysis",
        properties: [
            {
                id: 'output',
                label: 'Output',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: IMAGE
            },
            {
                id: 'input',
                label: 'Input',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: IMAGE
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["input"]) {
            const { max, result, image } = distanceImage(inputs["input"]);
            console.log(image);
            outputs["output"] = image;
        }
        return { outputs, preview };
    }
};

const argmaxProcessor = {
    nodeDefinition: {
        id: "argmax",
        label: "Argmax",
        categories: "math",
        properties: [
            {
                id: 'value',
                label: 'Value',
                type: PropertyType.OUTPUT,
                linkable: true,
                valueType: { type: CommonValueType.INTEGER }
            },
            {
                id: 'values',
                label: 'Values',
                type: PropertyType.INPUT,
                linkable: true,
                valueType: ARRAY
            }
        ]
    },
    evaluate: (inputs: {[id: string]: any}) => {
        const outputs = {};
        let preview = undefined;
        if (inputs["values"]) {
            outputs["value"] = argmax(inputs["values"]);
        }
        return { outputs, preview };
    }
};

export const processors: Processor[] = [
    inputImageProcessor,
    viewerProcessor,
    chartViewerProcessor,
    inputsProcessor,
    outputsProcessor,

    grayscaleProcessor,
    histogramProcessor,
    otsuLevelsProcessor,
    binarizationProcessor,
    distanceProcessor,

    marchingSquareProcessor,
    blobHierarchyProcessor,

    argmaxProcessor,
];

export const nodeDefinitions: NodeDefinition[] = processors.map(processor => processor.nodeDefinition);

let images: CatalogImage[] = [];

catalog.subscribe(values => {
    images = values;
});

function buildTreeFromCatalog() {
    return images.map(value =>({ name: value.name, title: value.name }));
}

const catalogImagePropertyHandler: PropertyHandler = {
    handlerMouseDown(editor: Editor, event: Event, property: NodePropertyView): State {
        const propBounds = property.globalBounds().shrink(editor.renderer.style.unit * 2, 0);
        if (propBounds.contains(event.position)) {
            const position = property.globalBounds().bottomLeft();
            const selectorResult = editor.openSelector(position, "select-tree", {
                nodes: buildTreeFromCatalog()
            });
            selectorResult.result.then(value => {
                editor.emit(new ChangePropertyValueCommand(property.property, value.name));
            }, () => {});
            return selectorResult.state;
        }
        return new IdleState();
    },

    layout(renderer: Renderer, property: NodePropertyView) {
        const m = renderer.context.measureText(property.property.definition.label);
        property.bounds = new Point(0, 0).rect(m.width + renderer.style.unit * 3, renderer.style.unit * 4);
    },

    draw(renderer: Renderer, property: NodePropertyView) {
        const propBounds = property.globalBounds();
        const style = renderer.style;
        const box = propBounds.shrink(style.unit * 2, 0).withHeight(style.unit * 4);
        renderer.roundBox()
            .filled(rgb(renderer.theme.PROPERTY_COLOR))
            .draw(box);

        renderer.drawText(propBounds.origin.offset(style.unit * 5, style.unit * 3), rgb(renderer.theme.TEXT_COLOR), property.property.definition.label + ":");
        const value = property.getValue();
        const stringValue = value ? value.toString() : "";
        renderer.drawText(propBounds.topRight().offset(-style.unit * 5, style.unit * 3), rgb(renderer.theme.TEXT_COLOR), stringValue, Align.RIGHT);
    }
};

export class NodeGraphicalHelper implements GraphicalHelper {
    getHeaderColor(node: Node): Color {
        if (node.definition.categories == "io") {
            return { r: 0xec, g: 0x73, b: 0x37 }; // orange
        }
        return { r: 0x00, g: 0xa9, b: 0x6a }; // green
    }

    getConnectorColor(property: NodeProperty): Color {
        if (property.definition.valueType.type == PixelFlowValueType.IMAGE) {
            return { r: 0xc7, g: 0xc7, b: 0x29 }; // yellow
        }
        if (property.definition.valueType.type == PixelFlowValueType.ARRAY) {
            return { r: 0x40, g: 0x63, b: 0xc7 }; // purple
        }
        return { r: 0xa1, g: 0xa1, b: 0xa1 }; // gray
    }

    getPropertyHandler(property: NodeProperty): PropertyHandler {
        if (property.definition.valueType.type == PixelFlowValueType.CATALOG_IMAGE) {
            return catalogImagePropertyHandler;
        }
        return getDefaultPropertyHandler(property);
    }
}

export const graphicalHelper = new NodeGraphicalHelper();
export const nodeFactory = new NodeFactory(nodeDefinitions);