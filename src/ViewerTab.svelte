<script>
    import { onMount } from "svelte";
    import { faPlus, faMinus, faCrosshairs, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
    import RoundButton from "./components/RoundButton.svelte";
    import { viewerContent } from "./store";
import ToolBar from "./components/ToolBar.svelte";

    const ZOOM_STEP = 1.2;

    let content;
    let contentElement;
    let canvasElement;
    let context;
    let origin = { x: 0, y: 0 };
    let zoom = 1.0;
    let width;
    let height;

    let imageCanvas;
    let imageContext;
    let needFit = true;
    let dragging = false;
    let dragStart;
    let originStart;

    let hideLayerSelector = true;
    let selectedLayers = {};

    const buttons = [
        { action: zoomFit, icon:  faCrosshairs },
        { action: zoomIn, icon:  faPlus },
        { action: zoomOut, icon:  faMinus },
        { action: layerSelect, icon:  faLayerGroup }
    ];

    onMount(() => {
        context = canvasElement.getContext("2d");

        imageCanvas = document.createElement("canvas");
        imageContext = imageCanvas.getContext("2d")

        return viewerContent.subscribe(result => {
            content = result;
            
            if (content) {
                imageCanvas.width = content.image.width;
                imageCanvas.height = content.image.height;
                imageContext.putImageData(content.image, 0, 0);
                if (content.layers) {
                    selectedLayers = {};
                    content.layers.forEach(layer => selectedLayers[layer.name] = true)
                }
                zoomFit();
            }
        })
    });

    export function refresh() {
        const r = contentElement.getBoundingClientRect();
        width = r.width;
        height = r.height;
        setTimeout(() => {
            if (needFit) zoomFit(); else drawImage();
        }, 10);
    }

    function drawImage() {
        if (content) {
            context.clearRect(0, 0, width, height);
            
            context.save();
            context.translate(origin.x, origin.y);
            context.scale(zoom, zoom);
            context.drawImage(imageCanvas, 0, 0); 
    
            if (content.layers) {
                const colors = [ "blue", "red", "green", "orange", "purple" ];
                context.strokeWidth = "2px";
                content.layers.forEach((layer, i) => {
                    if (selectedLayers[layer.name]) {
                        context.strokeStyle = colors[i % colors.length];
                        layer.marks.forEach(marker => {
                            context.beginPath();
                            context.rect(marker.x, marker.y, marker.width, marker.height);
                            context.stroke();
                        });
                    }
                });
            }
            context.restore();
        }
    }

    function zoomFit() {
        if (content && width && height) {
            needFit = false;
            zoom = Math.min(width / content.image.width, height / content.image.height);
            origin = { x: 0, y: 0 };
            drawImage();
        }
    }

    function zoomIn() {
        zoom *= ZOOM_STEP;
        drawImage();
    }

    function zoomOut() {
        zoom /= ZOOM_STEP;
        drawImage();
    }

    function layerSelect() {
        hideLayerSelector = ! hideLayerSelector;
    }

    function mouseDown(e) {
        dragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        originStart = origin;
    }

    function mouseUp(e) {
        dragging = false;
    }

    function mouseMove(e) {
        if (dragging) {
            const offsetX = e.clientX - dragStart.x;
            const offsetY = e.clientY - dragStart.y;
            origin = { x: Math.min(originStart.x + offsetX, 0), y: Math.min(originStart.y + offsetY, 0) };
            drawImage();
        }
    }

</script>

<style>
    div.main {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .layer-selector ul {
        list-style-type: none;
    }
    .layer-selector {
        position: absolute;
        bottom: 35px;
        right: 0;
        border-radius: 5px;
        border: 1px solid var(--border-color);
        background-color: var(--editor-color);
        padding: 10px;
    }
    .layer-selector.hide {
        display: none;
    }
</style>

<div class="main" bind:this={contentElement}>
    <ToolBar {buttons}>
        <div class="layer-selector" class:hide={hideLayerSelector}>
            {#if content && content.layers}
            <ul>
                {#each content.layers as layer}
                <li><input type="checkbox" bind:checked={selectedLayers[layer.name]}
                    on:change={e => drawImage()}> {layer.name} ({layer.marks.length})</li>
                {/each}
            </ul>
            {/if}
        </div>
    </ToolBar>
    <canvas bind:this={canvasElement} {width} {height}
            on:mousedown={mouseDown}
            on:mouseup={mouseUp}
            on:mousemove={mouseMove}></canvas>
</div>