<script>
    import Menu from "./components/Menu.svelte";
    import FlowGraphEditor from "./FlowGraphEditor.svelte";
    import { EngineInterface } from "./engine-interface";
    import { onMount } from "svelte";
    import { project } from "./store";
    import { catalog } from "./store";
    import { loader } from "./loader";
    
    let editor;

    onMount(() => {
        // preload some images
        Promise.all([
            loader.loadURL("alice.jpg", "alice.jpg"),
            loader.loadURL("lines.jpg", "lines.jpg"),
            loader.loadURL("binero1.jpg", "binero1.jpg")
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
    @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
    :global(html, body, *) {
        padding: 0;
        margin: 0;
        font-family: Roboto;
    }
</style>

<Menu />
<FlowGraphEditor bind:this={editor} />