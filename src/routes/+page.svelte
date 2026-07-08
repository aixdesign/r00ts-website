<script lang="ts">
    import { onMount } from "svelte";

    import Map from "$lib/components/Map/Map.svelte";

    import AboutPanel from "$lib/components/InfoPanels/AboutPanel.svelte";
    import IpPanel from "$lib/components/InfoPanels/IpPanel.svelte";
    import SearchBar from "$lib/components/SearchBar.svelte";
    import SessionPanel from "$lib/components/InfoPanels/SessionPanel.svelte";
    import SummaryPanel from "$lib/components/InfoPanels/SummaryPanel.svelte";

    import { dataState } from "$lib/components/InfoPanels/data.svelte.js";
    import { markerState } from "$lib/components/Map/marker.svelte.js";

    const { data } = $props();

    let firstVisit = $state(false);
    let inSession: boolean = $derived(
        Object.keys(dataState.entries).length > 0 ? true : false,
    );

    let searchFocused = $state(false);
    let showAbout = $derived(firstVisit && !inSession);

    let fitAll = $state((animate: boolean) => {
        animate;
    });

    $effect(() => {
        if (markerState.datacenter) showAbout = false;
    });

    $effect(() => {
        if (showAbout) markerState.datacenter = null;
    });

    $effect(() => {
        if (searchFocused) {
            showAbout = false;
        }
    });

    onMount(() => {
        dataState.isSearchResults = false;
        dataState.networks = data.networks;
        dataState.networksDatacenters = data.networksDatacenters;
        dataState.entries = data.entries;
        dataState.networkIps = data.networkIps;
        if (data.pageUrl) dataState.pageUrl = data.pageUrl;
        else dataState.pageUrl = "";
        dataState.datacenters = data.datacenters;

        firstVisit = !sessionStorage.getItem("hasVisited");
        sessionStorage.setItem("hasVisited", "true");
    });
</script>

<div class="contents">
    <Map
        datacenters={dataState.datacenters}
        showDebug={data.showDebug}
        leftPadding={data.entries ? 500 : 100}
        bind:fitAll
        zoomOnLoad={inSession}
    >
        {#if inSession}
            <SessionPanel />
            <IpPanel />
            <SummaryPanel />
        {:else}
            <SearchBar bind:hasFocus={searchFocused} {fitAll}></SearchBar>
            <a href="https://github.com/al165/r00ts-extension/releases/latest">
                <button id="r00ts-download-btn">
                    Download the extension (Firefox and Chrome!)
                </button>
            </a>
        {/if}
        <AboutPanel bind:show={showAbout} />
    </Map>
</div>

<style>
    .contents {
        padding: 0em;
        height: 100vh;
        width: 100vw;
        box-sizing: border-box;
    }

    #r00ts-download-btn {
        position: absolute;
        bottom: 2em;
        left: 2em;
        z-index: 12;
        padding: 1em 2em;
        font-family: inherit;
        font-size: 12pt;
        background: #ff70b3;
        border: none;
        cursor: pointer;
    }

    @media (width < 720px) {
        #r00ts-download-btn {
            display: none;
        }
    }
</style>
