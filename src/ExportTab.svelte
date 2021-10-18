<script>
    import { onMount } from "svelte";
    import { project } from "./store";
    import { nodeFactory } from "./nodes";

    let content = "";

    onMount(() => {
        return project.subscribe(p => {
            content = JSON.stringify(p, null, 2);
        });
    })
</script>

<style>
    pre {
        overflow: auto;
        width: 100%;
        height: 100%;
        /* padding: 20px; */
        background-color: var(--editor-color);
    }
</style>

<pre><code>{content}</code></pre>