import { NodeGroup, Node, PropertyType, NodeProperty } from "@madbrain/node-graph-editor";
import { EvaluationResult, Globals, Preview, Processor, processors } from "./nodes";

const processorByType = new Map<string, Processor>();

processors.forEach(processor => processorByType.set(processor.nodeDefinition.id, processor));

function evaluateNode(type: string, inputs: {[id: string]: any}, globals: Globals): EvaluationResult  {
    const processor = processorByType.get(type);

    if (processor) {
        return processor.evaluate(inputs, globals);
    }
    console.log("Unknown processor", type)
    return { outputs: {} };
}

class OutputValue {
    dirty = true;
    value: any = null;

    update(value: any) {
        if (this.value != value) {
            this.value = value;
            this.dirty = true;
        }
    }
}

class InputValue {
    dirty = true;
    output: OutputValue;
    value: any;

    constructor(public property: NodeProperty) {}

    update(output: OutputValue) {
        if (this.output != output) {
            this.output = output;
            this.dirty = true;
        }
        if (this.output == null && this.value != this.property.value) {
            this.dirty = true;
            this.value = this.property.value;
        }
    }

    isDirty() {
        if (this.output) {
            return this.dirty || this.output.dirty;
        } else {
            return this.dirty;
        }
    }

    getValue() {
        if (this.output) {
            return this.output.value;
        } else {
            return this.property.value;
        }
    }
}

class NodeInstance {

    needEvaluation = true;
    outputs = new Map<string, OutputValue>();
    previous: NodeInstance[] = [];
    inputs = new Map<string, InputValue>();
    preview: ImageData;
    
    constructor (public node: Node) {
        this.node.properties
            .forEach(prop => {
                if (prop.definition.type == PropertyType.OUTPUT) {
                    this.outputs.set(prop.definition.id, new OutputValue());
                } else {
                    this.inputs.set(prop.definition.id, new InputValue(prop));
                }
            });
    }

    update(node: Node) {
        this.node = node;
        this.node.properties
            .forEach(prop => {
                if (prop.definition.type == PropertyType.INPUT) {
                    this.inputs.get(prop.definition.id).property = prop;
                }
            });
        return this;
    }

    link(instanceMap: Map<string, NodeInstance>): void {
        this.previous = [];
        this.node.properties
            .filter(prop => prop.definition.type == PropertyType.INPUT)
            .forEach(prop => {
                if (prop.isConnected()) {
                    const connection = prop.connections[0];
                    const oppositeProp = connection.opposite(prop);
                    const oppositeNode = instanceMap.get(oppositeProp.node.id);
                    this.previous.push(oppositeNode);
                    this.inputs.get(prop.definition.id).update(oppositeNode.outputs.get(oppositeProp.definition.id));
                } else {
                    this.inputs.get(prop.definition.id).update(null);
                }
            });
    }

    evaluate(previews: { [name: string]: Preview }, globals: Globals): void {
        this.updateNeedEvaluation();
        if (this.needEvaluation) {
            console.log("Evaluating ", this.node.definition.id);
            const inputs = {};
            for (let [prop, value] of this.inputs.entries()) {
                inputs[prop] = value.getValue();
            }
            const { outputs, preview } = evaluateNode(this.node.definition.id, inputs, globals);
            if (preview) {
                previews[this.node.id] = preview;
            }
            for (let [prop, output] of this.outputs.entries()) {
                output.update(outputs[prop]);
            }
            for(let input of this.inputs.values()) {
                input.dirty = false;
            }
        }
        this.needEvaluation = false;
    }

    clearOutputsDirty() {
        for (let [prop, output] of this.outputs.entries()) {
            output.dirty = false;
        }
    }

    private updateNeedEvaluation() {
        this.inputs.forEach(value => {
            if (value.isDirty()) {
                this.needEvaluation = true;
            }
        });
    }
}

export type Previews = { [name: string]: Preview };

export interface ProgressMonitor {
    start();
    progress(amount: number, message: string);
    end();
}

export class Engine {

    constructor(private globals: Globals, private progressMonitor: ProgressMonitor) {}

    private instances: NodeInstance[] = [];

    update(graph: NodeGroup): Previews {

        // Sync
        let instanceMap = new Map<string, NodeInstance>();
        this.instances.forEach(instance => instanceMap.set(instance.node.id, instance));
        this.instances = graph.nodes.map(node => {
            const instance = instanceMap.get(node.id);
            return instance ? instance.update(node) : new NodeInstance(node);
        });
        this.instances.forEach(instance => instanceMap.set(instance.node.id, instance));
        this.instances.forEach(instance => instance.link(instanceMap));

        // Topological sort
        const work = this.instances.slice();
        this.instances = [];
        while (work.length > 0) {
            const instance = work.pop();
            if (instance.previous.every(i => this.instances.indexOf(i) >= 0)) {
                this.instances.push(instance);
            } else {
                work.unshift(instance);
            }
        }

        // Evaluate
        let previews: Previews = {};
        this.progressMonitor.start();
        let count = 0;
        this.instances.forEach(instance => {
            this.progressMonitor.progress(count++ / this.instances.length, instance.node.definition.label);
            instance.evaluate(previews, this.globals);
            this.progressMonitor.progress(count / this.instances.length, instance.node.definition.label);
        });
        this.progressMonitor.end();
        this.instances.forEach(instance => {
            instance.clearOutputsDirty();
        });
        return previews;
    }
}