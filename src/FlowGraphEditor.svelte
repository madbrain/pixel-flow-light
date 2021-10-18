<script>
    import { onMount } from "svelte";
    import { GraphEditor } from "@madbrain/node-graph-editor"
    import "@madbrain/node-graph-editor/dist/editor.css";
    import "@madbrain/node-graph-editor/dist/image-kit.css";
    import { nodeFactory, graphicalHelper } from "./nodes";
    import { project } from "./store";
    import TabContainer from './TabContainer.svelte';
    import ProgressMonitor from './ProgressMonitor.svelte';

    let element;
    let editor;
    let currentProject = null;
    let currentGraph = null;

    onMount(() => {
        editor = new GraphEditor({
            container: element,
            graphicalHelper,
            nodeFactory
        });
        // editor.registerSelector("select-color", new ColorSelector());
        editor.onGraphChange(nodeGroup => {
            currentGraph.nodeGroup = nodeFactory.save(nodeGroup);
            project.set(currentProject);
        });
        project.subscribe(p => {
            currentProject = p;
            const graph = p.graphs.find(g => g.selected);
            if (graph != currentGraph) {
                currentGraph = graph;
                editor.load(currentGraph.nodeGroup);
            }
        });
    });

    export function updatePreviews(previews) {
        editor.updatePreviews(previews);
    }

</script>

<style>
    div.editor {
        width: 100vw;
        height: 100vh;
    }
</style>

<div class="editor" bind:this={element}>
</div>
<TabContainer />
<ProgressMonitor />