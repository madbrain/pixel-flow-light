<script>
    import { onMount } from "svelte";
    import { faTrash } from '@fortawesome/free-solid-svg-icons';
    import { catalog } from "./store";
    import { loader } from "./loader";
    import RoundButton from "./components/RoundButton.svelte";

    let images = [];

    onMount(() => {
        return catalog.subscribe(result => {
            images = result;
        });
    });

    function handleFiles(files) {
        loader.load(files[0]).then(image => {
            catalog.set(images.concat(image));
        }, () => {});
    }

    function removeImage(image) {
        catalog.set(images.filter(i => i != image));
    }

</script>

<style>
    input {
        margin: 10px;
    }
    ul {
        margin: 10px;
    }
</style>

<input type="file" accept="image/png, image/jpeg" on:change={(e) => handleFiles(e.srcElement.files)}>
<ul>
    {#each images as image}
    <li>{image.name} <RoundButton on:click={() => removeImage(image)} icon={faTrash}/></li>
    {/each}
</ul>