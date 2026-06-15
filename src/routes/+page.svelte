<script lang="ts">
    import DataPanel from "$lib/components/InfoPanels/DataPanel.svelte";
    import IpPanel from "$lib/components/InfoPanels/IpPanel.svelte";
    import SummaryPanel from "$lib/components/InfoPanels/SummaryPanel.svelte";
    import Map from "$lib/components/Map/Map.svelte";

    const { data } = $props();
</script>

<div class="contents">
    <Map
        datacenters={data.datacenters}
        showDebug={data.showDebug}
        leftPadding={data.ipData ? 500 : 100}
    >
        <DataPanel
            entries={data.ipData}
            networksDatacenters={data.networksDatacenters}
        />
        {#if data.ipData}
            <IpPanel
                entries={data.ipData}
                networks={data.networks}
                networksDatacenters={data.networksDatacenters}
                pageUrl={data.pageUrl}
            />
            <SummaryPanel
                entries={data.ipData}
                datacenters={data.datacenters}
                pageUrl={data.pageUrl}
            />
        {/if}
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
