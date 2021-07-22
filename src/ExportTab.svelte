<script>
    import { onMount } from "svelte";
    import { graph } from "./store";
    import { nodeFactory } from "./nodes";

    let content = "";

    onMount(() => {
        return graph.subscribe(c => {
            content = JSON.stringify(nodeFactory.save(c), null, 2);
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