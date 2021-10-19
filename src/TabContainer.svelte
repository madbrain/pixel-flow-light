<script>
    import Fa from 'svelte-fa';
    import { faArrowUp, faArrowDown, faExpand, faCompress, faImage, faEye, faBook, faFileExport } from '@fortawesome/free-solid-svg-icons';
    import { TabState } from "./tab-state";
    import RoundButton from "./components/RoundButton.svelte";
    import ExportTab from './ExportTab.svelte';
    import ImagesTab from './ImagesTab.svelte';
    import ViewerTab from './ViewerTab.svelte';
    import LibraryTab from './LibraryTab.svelte';

    let mode = TabState.COLLAPSED;

    let tabs = [
        { label: "Images", component: ImagesTab, icon: faImage },
        { label: "Viewer", component: ViewerTab, icon: faEye },
        { label: "Library", component: LibraryTab, icon: faBook },
        { label: "Export", component: ExportTab, icon: faFileExport },
    ];
    let active = tabs[0];
    let instance;
    
    $ : refresh(instance, mode);

    function refresh(instance, mode) {
        if (instance && instance.refresh) {
            instance.refresh(mode);
        }
    }

    function toggleCollapsed() {
        if (mode == TabState.COLLAPSED) {
            mode = TabState.OPEN;
        } else {
            mode = TabState.COLLAPSED;
        }
    }

    function toggleFull() {
        if (mode == TabState.FULLSCREEN) {
            mode = TabState.OPEN;
        } else {
            mode = TabState.FULLSCREEN;
        }
    }

    function select(tab) {
        if (mode == TabState.COLLAPSED) {
            mode = TabState.OPEN;
        }
        active = tab;
    }
</script>

<style>
    .container {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 33%;
        height: 33%;
        z-index: 100;
        background-color: var(--back-color);
        border: 1px solid var(--border-color);
        --border-color: #565656;
        --back-color: #454545;
        --inactive-color: #656565;
        --editor-color: #808080;
        --header-height: 42px;
    }
    .container.collapsed {
        height: var(--header-height);
    }
    .container.fullscreen {
        height: 100%;
        width: 50%;
    }
    header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        height: var(--header-height);
        border-bottom: 1px solid var(--border-color);
    }
    header li {
        display: inline-block;
        padding: 10px;
        background-color: var(--inactive-color);
        border-right: 1px solid var(--border-color);
        color: lightgray;
    }
    li.active {
        color: black;
        background-color: var(--editor-color);
    }
    span {
        cursor: pointer;
    }
    .content {
        height: calc(100% - var(--header-height));
        width: 100%;
    }
    .buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 5px;
    }
    :global(.icon) {
        padding-right: 5px;
    }
</style>

<div class="container" class:collapsed={mode==TabState.COLLAPSED} class:fullscreen={mode==TabState.FULLSCREEN}>
    <header>
        <ul>
            {#each tabs as tab}
            <li class:active={tab == active}><span on:click={() => select(tab)}><Fa class="icon" icon={tab.icon}/>{tab.label}</span></li>
            {/each}
        </ul>
        <div class="buttons">
            <RoundButton on:click={() => toggleFull()} icon={mode != TabState.FULLSCREEN ? faExpand : faCompress}/>
            <RoundButton on:click={() => toggleCollapsed()} icon={mode != TabState.COLLAPSED ? faArrowDown : faArrowUp}/>
        </div>
    </header>
    <div class="content">
        <svelte:component this={active.component} bind:this={instance}/>
    </div>
</div>