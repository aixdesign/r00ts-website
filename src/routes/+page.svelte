<script lang="ts">
    import DataPanel from "$lib/components/InfoPanels/DataPanel.svelte";
    import Map from "$lib/components/Map/Map.svelte";

    let { data } = $props();
</script>

<div class="contents">
    <Map geoJSON={data}>
        <DataPanel />
    </Map>
</div>

<style>
    .contents {
        padding: 1.6em;
        height: 100vh;
        width: 100vw;
        box-sizing: border-box;
    }
</style>
