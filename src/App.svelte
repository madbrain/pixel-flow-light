<script>
    import FlowGraphEditor from "./FlowGraphEditor.svelte";
    import { EngineInterface } from "./engine-interface";
    import { onMount } from "svelte";
    import { graph } from "./store";
    import { example } from "./examples";
    import { catalog } from "./store";
    import { loader } from "./loader";
    
    let editor;

    onMount(() => {
        // preload some images
        Promise.all([
            loader.loadURL("alice.jpg", "alice.jpg"),
            loader.loadURL("lines.jpg", "lines.jpg")
        ]).then(images => {
            catalog.set(images);
        }, e => {
            console.log("ERROR loading", e)
        });

        const engine = new EngineInterface(editor);
        return graph.subscribe(g => {
            engine.update(g);
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