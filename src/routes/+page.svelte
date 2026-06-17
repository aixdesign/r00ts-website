<script lang="ts">
    import { untrack } from "svelte";

    import IpPanel from "$lib/components/InfoPanels/IpPanel.svelte";
    import SummaryPanel from "$lib/components/InfoPanels/SummaryPanel.svelte";
    import Map from "$lib/components/Map/Map.svelte";

    import { dataState } from "$lib/components/InfoPanels/data.svelte.js";
    import AboutPanel from "$lib/components/InfoPanels/AboutPanel.svelte";

    const { data } = $props();

    untrack(() => {
        dataState.networks = data.networks;
        dataState.networksDatacenters = data.networksDatacenters;
        dataState.entries = data.entries;
    });
</script>

<div class="contents">
    <Map
        datacenters={data.datacenters}
        showDebug={data.showDebug}
        leftPadding={data.entries ? 500 : 100}
    >
        {#if data.entries}
            <IpPanel pageUrl={data.pageUrl} />
            <SummaryPanel
                entries={data.entries}
                datacenters={data.datacenters}
                pageUrl={data.pageUrl}
            />
        {/if}
        <AboutPanel />
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
