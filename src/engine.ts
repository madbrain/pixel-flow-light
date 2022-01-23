import { NodeGroup, Node, PropertyType, NodeProperty, isOutput } from "@madbrain/node-graph-editor";
import { globals } from "svelte/internal";
import type { Project } from "./api";
import { EvaluationResult, Globals, Preview, Processor, processors, nodeFactory, makeNodeId } from "./nodes";

const processorByType = new Map<string, Processor>();

processors.forEach(processor => processorByType.set(processor.nodeDefinition.id, processor));

interface Context {
    globals: Globals;
    functions: Map<String, LocalFunction>;
}

function evaluateNode(type: string, inputs: {[id: string]: any}, context: Context): EvaluationResult  {
    const localFunction = context.functions.get(type);
    if (localFunction) {
        return localFunction.evaluate(inputs, context);
    }
    const processor = processorByType.get(type);

    if (processor) {
        return processor.evaluate(inputs, context.globals);
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

    evaluate(previews: { [name: string]: Preview }, context: Context): void {
        this.updateNeedEvaluation();
        if (this.needEvaluation) {
            console.log("Evaluating ", this.node.definition.id);
            const inputs = {};
            for (let [prop, value] of this.inputs.entries()) {
                inputs[prop] = value.getValue();
            }
            const { outputs, preview } = evaluateNode(this.node.definition.id, inputs, context);
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

class LocalFunction {
    
    constructor(public name: String, private nodes: Node[]) {}

    evaluate(inputs: { [id: string]: any; }, context: Context): EvaluationResult {
        const nodeOutputs = new Map<Node, {}>();
        const funcOutputs = {};
        this.nodes.forEach(node => {
            if (node.definition.id == "inputs") {
                const values = {}
                node.findProperty("inputs").subProperties.forEach(prop => {
                    values[prop.definition.id] = inputs[prop.definition.id];
                });
                nodeOutputs.set(node, values);
            } else if (node.definition.id == "outputs") {
                node.findProperty("outputs").subProperties.forEach(prop => {
                    const outputProp = prop.connections[0].opposite(prop);
                    const value = nodeOutputs.get(outputProp.node)[outputProp.definition.id];
                    funcOutputs[prop.definition.id] = value;
                });
            } else {
                const nodeInputs = {};
                node.properties
                    .filter(prop => prop.definition.type == PropertyType.INPUT)
                    .forEach(prop => {
                        if (prop.isConnected()) {
                            const inputProp = prop.connections[0].opposite(prop);
                            const value = nodeOutputs.get(inputProp.node)[inputProp.definition.id];
                            nodeInputs[prop.definition.id] = value;
                        }
                    })
                const { outputs } = evaluateNode(node.definition.id, nodeInputs, context);
                nodeOutputs.set(node, outputs);
            }
        });
        return { outputs: funcOutputs };
    }
}

export class Engine {

    constructor(private globals: Globals, private progressMonitor: ProgressMonitor) {}

    private instances: NodeInstance[] = [];

    update(project: Project): Previews {
        const nodeGroups = project.graphs.map(g => ({ name: makeNodeId(g.name), nodeGroup: nodeFactory.load(g.nodeGroup) }));
        
        // TODO should make some cache on local functions as well
        const localFunctions = new Map<String, LocalFunction>();
        nodeGroups.filter(g => g.name != "app:main").forEach(g => {
            const func = this.compileNodeGroup(g.name, g.nodeGroup);
            localFunctions.set(func.name, func);
        })

        return this.updateGraph(nodeGroups.find(g => g.name === "app:main").nodeGroup, { functions: localFunctions, globals: this.globals });
    }

    private compileNodeGroup(name: String, nodeGroup: NodeGroup) {
        console.log("ENGINE COMPILE", name, nodeGroup);
        const outputNodes = nodeGroup.nodes.filter(node => node.definition.id == "outputs");

        const ancestors = new Map<Node, Node[]>();
        nodeGroup.nodes.forEach(node => ancestors.set(node, this.findAncestors(node)));
        
        const reachables = this.findReachables(outputNodes, ancestors);
        
        // Topological sort again
        const work = nodeGroup.nodes.slice();
        const orderedNodes = [];
        while (work.length > 0) {
            const node = work.pop();
            if (reachables.indexOf(node) < 0) {
                console.log("PRUNE", node.definition.id);
            } else if (ancestors.get(node).every(i => orderedNodes.indexOf(i) >= 0)) {
                orderedNodes.push(node);
            } else {
                work.unshift(node);
            }
        }
        return new LocalFunction(name, orderedNodes);
    }

    private findReachables(outputNodes: Node[], ancestors: Map<Node, Node[]>) {
        const work = outputNodes.slice();
        const reachables = outputNodes.slice();
        while (work.length > 0) {
            const node = work.pop();
            ancestors.get(node).forEach(n => {
                if (reachables.indexOf(n) < 0) {
                    reachables.push(n);
                    work.push(n)
                }
            });
        }
        return reachables;
    }

    private findAncestors(node: Node): Node[] {
        const result = [];
        function collect(prop: NodeProperty) {
            prop.connections.forEach(c => {
                const n = c.opposite(prop).node;
                if (result.indexOf(n) < 0) {
                    result.push(n);
                }
            });
        }
        node.properties.forEach(prop => {
            if (! isOutput(prop.definition.type)) {
                if (prop.subProperties && prop.subProperties.length > 0) {
                    prop.subProperties.forEach(p => collect(p));
                } else {
                    collect(prop);
                }
            }
        });
        return result;
    }

    private updateGraph(graph: NodeGroup, context: Context): Previews {

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
            instance.evaluate(previews, context);
            this.progressMonitor.progress(count / this.instances.length, instance.node.definition.label);
        });
        this.progressMonitor.end();
        this.instances.forEach(instance => {
            instance.clearOutputsDirty();
        });
        return previews;
    }
}