<script>
    import RoundButton from "./RoundButton.svelte";
    export let buttons = [];
    export let hide = false;
</script>

<style>
    .toolbar {
        position: absolute;
        bottom: 10px;
        right: 10px;
    }
    .toolbar.hide {
        display: none;
    }
</style>

<div class="toolbar" class:hide>
    {#each buttons as button}
        <RoundButton on:click={() => button.action()} icon={button.icon}/>&nbsp;
    {/each}
    <slot></slot>
</div>