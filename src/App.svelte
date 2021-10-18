<script>
    import FlowGraphEditor from "./FlowGraphEditor.svelte";
    import { EngineInterface } from "./engine-interface";
    import { onMount } from "svelte";
    import { graph, project } from "./store";
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
        return project.subscribe(p => {
            engine.update(p);
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

<FlowGraphEditor bind:this={editor} />