import { NodeGroup, Node, PropertyType, NodeProperty } from "@madbrain/node-graph-editor";
import { EvaluationResult, Processor, processors } from "./nodes";

const processorByType = new Map<string, Processor>();

processors.forEach(processor => processorByType.set(processor.nodeDefinition.id, processor));

function evaluateNode(type: string, inputs: {[id: string]: any}): EvaluationResult  {
    const processor = processorByType.get(type);

    if (processor) {
        return processor.evaluate(inputs);
    } else {
        console.log("Unknown processor", type)
    }
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
    outputs = new Map<NodeProperty, OutputValue>();
    previous: NodeInstance[] = [];
    inputs = new Map<NodeProperty, InputValue>();
    preview: ImageData;
    
    constructor (public node: Node) {
        this.node.properties
            .forEach(prop => {
                if (prop.definition.type == PropertyType.OUTPUT) {
                    this.outputs.set(prop, new OutputValue());
                } else {
                    this.inputs.set(prop, new InputValue(prop));
                }
            });
    }

    link(instanceMap: Map<Node, NodeInstance>): void {
        this.previous = [];
        this.node.properties
            .filter(prop => prop.definition.type == PropertyType.INPUT)
            .forEach(prop => {
                if (prop.isConnected()) {
                    const connection = prop.connections[0];
                    const oppositeProp = connection.opposite(prop);
                    const oppositeNode = instanceMap.get(oppositeProp.node);
                    this.previous.push(oppositeNode);
                    this.inputs.get(prop).update(oppositeNode.outputs.get(oppositeProp));
                } else {
                    this.inputs.get(prop).update(null);
                }
            });
    }

    evaluate(previews: { [name: string]: ImageData }): void {
        this.updateNeedEvaluation();
        if (this.needEvaluation) {
            const inputs = {};
            for (let [prop, value] of this.inputs.entries()) {
                inputs[prop.definition.id] = value.getValue();
            }
            const { outputs, preview } = evaluateNode(this.node.definition.id, inputs);
            if (preview) {
                previews[this.node.id] = preview;
            }
            for (let [prop, output] of this.outputs.entries()) {
                output.update(outputs[prop.definition.id]);
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
        this.inputs
            .forEach(value => {
                if (value.isDirty()) {
                    this.needEvaluation = true;
                }
            });
        this.needEvaluation;
    }
}

export class Engine {

    private instances: NodeInstance[] = [];

    update(graph: NodeGroup): { [name: string]: ImageData } {

        // Sync
        let instanceMap = new Map<Node, NodeInstance>();
        this.instances.forEach(instance => instanceMap.set(instance.node, instance));
        this.instances = graph.nodes.map(node => {
            const instance = instanceMap.get(node);
            return instance ? instance : new NodeInstance(node);
        });
        this.instances.forEach(instance => instanceMap.set(instance.node, instance));
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
        let previews = {};
        this.instances.forEach(instance => {
            instance.evaluate(previews);
        });
        this.instances.forEach(instance => {
            instance.clearOutputsDirty();
        });
        return previews;
    }
}