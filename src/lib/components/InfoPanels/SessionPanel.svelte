<script lang="ts">
    import { resolve } from "$app/paths";
    import { markerState } from "../Map/marker.svelte";

    import { dataState } from "./data.svelte";

    function onclick() {
        dataState.entries = {};
        dataState.networks = {};
        dataState.networksDatacenters = {};
        dataState.isSearchResults = false;
        dataState.datacenters = [];
        markerState.datacenter = null;
        markerState.highlighted = [];
        markerState.preview = [];

        fetch(resolve("/api/datacenter"))
            .then((res) => res.json())
            .then((data) => {
                dataState.datacenters = data.datacenters;
            })
            .catch((err) => {
                console.error(err);
            });
    }
</script>

<div class="container">
    {#if dataState.pageUrl}
        <div class="url">{dataState.pageUrl}</div>
    {/if}
    <button {onclick}>Exit session</button>
</div>

<style>
    .container {
        position: absolute;
        top: 2em;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        z-index: 12;
        padding: 0;
    }

    .url {
        font-family: inherit;
        background: white;
        display: inline-block;
        padding: 0.5em 1em;
    }

    button {
        font-family: inherit;
        font-size: inherit;
        border: none;
        padding: 0.5em 1em;
        background: #ff65ad;
        cursor: pointer;
        margin: 0;
        box-sizing: border-box;
    }
</style>
