<script>
    import { project } from "../store";
    import { exampleProject as example1 } from "../examples";
    import { exampleProject as example2 } from "../examples2";

    const examples = [
        { label: "Example OCR", value: example1 },
        { label: "Example Grid", value: example2 },
    ];

    function loadExample(example) {
        project.set(example.value);
    }
</script>

<style>
    .menu {
        position: fixed;
        width: 100vw;
        background-color: #444444;
        border-bottom: 1px solid #565656;
        color: white;
    }
    .menu-list {
        display: flex;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
    .menu-item {
        list-style: none;
        padding: 10px;
    }
    .menu-item:hover {
        background-color: #808080;
    }
</style>

<div class="menu">
    <ul class="menu-list">
        {#each examples as example}
        <li class="menu-item">
            <span on:click={() => loadExample(example)}>{example.label}</span>
        </li>
        {/each}
    </ul>
</div>