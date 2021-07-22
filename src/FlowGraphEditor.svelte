<script>
    import { onMount } from "svelte";
    import { GraphEditor } from "@madbrain/node-graph-editor"
    import "@madbrain/node-graph-editor/dist/editor.css";
    import "@madbrain/node-graph-editor/dist/image-kit.css";
    import { nodeFactory, graphicalHelper } from "./nodes";
    import { graph } from "./store";
    import TabContainer from './TabContainer.svelte';

    export let nodeGroup = { nodes: [], connections: [] };
    let element;
    let editor;

    onMount(() => {
        editor = new GraphEditor({
            container: element,
            graphicalHelper,
            nodeFactory
        });
        // editor.registerSelector("select-color", new ColorSelector());
        editor.onGraphChange(nodeGroup => {
            graph.set(nodeGroup);
        });
        editor.load(nodeGroup);
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