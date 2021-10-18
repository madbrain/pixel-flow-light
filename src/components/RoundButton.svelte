<script>
    import Fa from 'svelte-fa';
    export let icon;
</script>
<style>
    button.round {
        width: 30px;
        height: 30px;
        border: 1px solid var(--border-color);
        border-radius: 50%;
        background-color: var(--inactive-color);
        outline: none;
        text-align: center;
        color: lightgray;
    }
    button:hover {
        background-color: var(--editor-color);
    }
</style>

<button class="round" on:click><Fa {icon}/></button>