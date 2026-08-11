<script lang="ts">
    import { markerState } from "../Map/marker.svelte";
    import { dataState } from "$lib/components/InfoPanels/data.svelte.js";
    import { padIp } from "$lib/ip_utils";

    import IpDetailsPanel from "./IpDetailsPanel.svelte";
    import HoverTip from "../HoverTip.svelte";

    let selectedNetId: number | null = $state(null);

    function preview(netId: number | null) {
        if (netId == null || !dataState.networksDatacenters[netId])
            markerState.preview = [];
        else markerState.preview = dataState.networksDatacenters[netId];
    }

    $effect(() => {
        if (
            selectedNetId == null ||
            !dataState.networksDatacenters[selectedNetId]
        ) {
            markerState.highlighted = [];
            return;
        }

        markerState.highlighted = dataState.networksDatacenters[selectedNetId];
    });

    $effect(() => {
        if (markerState.datacenter != null) selectedNetId = null;
    });

    let entryElement: HTMLDivElement | null = $state(null);
</script>

<div class="wrapper">
    <div class="container">
        {#each Object.keys(dataState.networkIps).map( (k) => parseInt(k), ) as netId}
            <div
                class="entry"
                class:selected={selectedNetId == netId}
                onclick={(ev) => {
                    selectedNetId = selectedNetId == netId ? null : netId;
                    entryElement = ev.currentTarget;
                    markerState.datacenter = null;
                }}
                onmouseover={() => {
                    preview(netId);
                }}
                onfocus={() => {
                    preview(netId);
                }}
                onmouseout={() => {
                    preview(null);
                }}
                onblur={() => {
                    preview(null);
                }}
                role="button"
                tabindex="0"
                aria-label="Datacenter"
                onkeydown={() => {}}
            >
                <span class="net-name">
                    {#if dataState.networks}
                        {dataState.networks[netId]?.organisation_name}
                        <!-- {dataState.networks[netId].network_name} -->
                        {#if !dataState.networksDatacenters[netId]}
                            <HoverTip
                                text="No datacenters found for this network!"
                            >
                                [!]
                            </HoverTip>
                        {/if}
                    {/if}
                </span>
                <div class="ip-list">
                    {#each dataState.networkIps[netId] as entry}
                        <span class="ip">{padIp(entry.ip)}</span>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
    <IpDetailsPanel
        networkIps={dataState.networkIps}
        {selectedNetId}
        {entryElement}
    />
</div>

<style>
    .wrapper {
        position: absolute;
        left: 1em;
        top: 6em;
        z-index: 10;
        display: flex;
        max-height: 60%;
    }

    .container {
        background: white;
        display: flex;
        overflow-y: scroll;
        flex-direction: column;
        font-size: 16pt;
    }

    .ip {
        text-align: right;
        white-space-collapse: preserve-spaces;
    }

    .entry {
        cursor: pointer;
        border: none;
        text-align: left;
        font-family: inherit;
        font-weight: inherit;
        font-size: inherit;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 0 1em;
        background: inherit;
    }

    .net-name {
        position: sticky;
        top: 0px;
        background: inherit;
        width: 8em;
    }

    .ip-list {
        display: flex;
        flex-direction: column;
    }

    .selected,
    .entry:hover {
        background: #edff00;
    }
</style>
