<script>
    import { onMount } from "svelte";
    import RoundButton from "./components/RoundButton.svelte";
    import ToolBar from "./components/ToolBar.svelte";
    import ValueInput from "./components/ValueInput.svelte";
    import { faTrash, faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
    import { project } from "./store";

    let valueInput;
    let currentProject;
    let graphs = [];

    onMount(() => {
        return project.subscribe(p => {
            currentProject = p;
            graphs = p.graphs;
        });
    });

    const buttons = [
        { action: addGraph, icon: faPlus }
    ];

    function addGraph() {
        const graph = { name: "Unnamed", removable: true, nodeGroup: {
            nodes: [],
            connections: [],
            canvas: {
                position: {
                    x: 0,
                    y: 0
                },
                zoom: 1.0
            }
        } };
        graphs = graphs.concat(graph);
        renameGraph(graph).then(e => {
            viewGraph(graph);
        });
    }

    function viewGraph(graph) {
        currentProject.graphs = graphs = graphs.map(g => {
            g.selected = g == graph;
            return g;
        });
        project.set(currentProject);
    }

    function renameGraph(graph) {
        return valueInput.open(graph.name).then(value => {
            if (value) {
                graphs = graphs.map(g => {
                    if (g == graph) {
                        g.name = value;
                    }
                    return g;
                });
            }
        });
    }

    function removeGraph(graph) {
        if (graph.selected) {
            graphs[0].selected = true;
        }
        currentProject.graphs = graphs = graphs.filter(g => g != graph);
        project.set(currentProject);
    }
</script>

<style>
    ul {
        margin: 10px;
        list-style-type: none;
    }
    .selected span.name {
        background-color: var(--editor-color);
    }
    span.name {
        padding: 3px;
        border-radius: 10px;
        border: 2px solid var(--back-color);
    }
    span.name:hover {
        border: 2px solid var(--editor-color);
    }
    span.buttons {
        visibility: hidden;
    }
    li:hover span.buttons {
        visibility: visible;
    }
</style>

<ul>
    <ToolBar {buttons} />
    {#each graphs as graph}
    <li class:selected={graph.selected}>
        <span class="name" on:click={() => viewGraph(graph)}>{graph.name}</span>
        <span class="buttons">
            <RoundButton on:click={() => renameGraph(graph)} icon={faEdit}/>
            {#if graph.removable}<RoundButton on:click={() => removeGraph(graph)} icon={faTrash}/>{/if}
        </span>
    </li>
    {/each}
</ul>
<ValueInput bind:this={valueInput} />