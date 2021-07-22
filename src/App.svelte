<script>
    import FlowGraphEditor from "./FlowGraphEditor.svelte";
    import { Engine } from "./engine";
    import { onMount } from "svelte";
    import { graph } from "./store";
    import { example } from "./examples";
    import { catalog } from "./store";
    import { loader } from "./loader";
    
    let engine = new Engine();
    let editor;

    onMount(() => {
        Promise.all([
            loader.loadURL("alice.jpg", "alice.jpg"),
            loader.loadURL("lines.jpg", "lines.jpg")
        ]).then(images => {
            catalog.set(images);
        }, e => {
            console.log("ERROR loading", e)
        })
        return graph.subscribe(g => {
            const previews = engine.update(g);
            editor.updatePreviews(previews);
        });
    })
</script>

<style>
    :global(html, body, *) {
        padding: 0;
        margin: 0;
        font-family: Roboto;
    }
</style>

<FlowGraphEditor bind:this={editor} nodeGroup={example} />