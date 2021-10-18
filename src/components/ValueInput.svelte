<script>
    let hide = true;
    let inputElement;
    let resolveFunc;

    export function open(value) {
        hide = false;
        inputElement.value = value;
        setTimeout(() => {
            inputElement.focus();
            inputElement.select();
        }, 0);
        return new Promise((resolve, reject) => {
            resolveFunc = resolve;
        });
    }
    
    function close(value) {
        hide = true;
        resolveFunc(value);
    }

    function handleKey(e) {
        if (e.key == "Escape") {
            close(null);
        } else  if (e.key == "Enter") {
            close(inputElement.value);
        }
    }
</script>

<style>
.input-glass-pane {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
}
.input-glass-pane.hide {
    display: none;
}
.selector {
    top: 50%;
    left: 50%;
}
</style>

<div class="input-glass-pane" class:hide on:click={() => close(null) }>
    <div class="selector">
        <input class="value-selector" bind:this={inputElement} on:keyup={e => handleKey(e)}>
    </div>
</div>