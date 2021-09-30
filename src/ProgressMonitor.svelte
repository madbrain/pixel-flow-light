<script>
    import { onMount } from "svelte";
    import { progressMonitor } from "./store";
    
    let visible = false;
    let message = "";
    let amount = 0;

    onMount(() => {
        progressMonitor.subscribe(event => {
            if (event) {
                visible = event.visible;
                message = event.message;
                amount = event.amount || 0;
            }
        });
    })
</script>

<div class:visible class="main">
    <div class="bar-parent">
        <div class="bar" style="width: {amount*300}px"></div>
    </div>
    <p>{message}</p>
</div>

<style>
    .main {
        display: none;
        position: absolute;
        left: 10px;
        bottom: 10px;
        border-radius: 5px;
        background-color: #454545;
        padding: 5px;
    }
    .visible {
        display: block;
    }
    .bar-parent {
        width: 300px;
    }
    .bar {
        height: 10px;
        background-color: #4a83fd;
        padding: 5px;
    }
    p {
        color: white;
        font-size: 0.7em;
    }
</style>
