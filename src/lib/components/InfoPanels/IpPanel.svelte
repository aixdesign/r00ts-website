<script lang="ts">
    import type { Entry } from "$lib/types";

    import { markerState } from "../Map/marker.svelte";
    import { dataState } from "$lib/components/InfoPanels/data.svelte.js";

    import IpDetailsPanel from "./IpDetailsPanel.svelte";

    interface Props {
        pageUrl?: string;
    }

    let { pageUrl }: Props = $props();
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

    const networkIps: { [key: number]: Entry[] } = $derived.by(() => {
        const result: { [key: number]: Entry[] } = {};

        for (const ip of Object.keys(dataState.entries)) {
            const entry = dataState.entries[ip];
            if (!entry.network_id) continue;

            console.log(entry);

            if (!result[entry.network_id]) result[entry.network_id] = [];

            result[entry.network_id].push(dataState.entries[ip]);
        }

        for (const net_id of Object.keys(result)) {
            result[parseInt(net_id)].sort((a, b) => {
                return a.ip < b.ip ? -1 : 1;
            });
        }

        return result;
    });

    let entryElement: HTMLDivElement | null = $state(null);
</script>

<div class="wrapper">
    <div class="container">
        <span>[ {pageUrl ?? "unknown"} ]</span>
        {#each Object.keys(networkIps).map((k) => parseInt(k)) as netId}
            <div
                class="entry"
                class:selected={selectedNetId == netId}
                onclick={(ev) => {
                    selectedNetId = selectedNetId == netId ? null : netId;
                    entryElement = ev.currentTarget;
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
                        {dataState.networks[netId].network_name}
                        {#if !dataState.networksDatacenters[netId]}
                            [!]
                        {/if}
                    {/if}
                </span>
                {#each networkIps[netId] as entry}
                    <span class="ip">{entry.ip}</span>
                {/each}
            </div>
        {/each}
    </div>
    <IpDetailsPanel
        networks={dataState.networks}
        {networkIps}
        {selectedNetId}
        {entryElement}
    />
</div>

<style>
    .wrapper {
        position: absolute;
        left: 1em;
        top: 2em;
        z-index: 10;
        display: flex;
        max-height: 60%;
    }

    .container {
        background: #e7e7e7;
        display: flex;
        overflow-y: scroll;
        flex-direction: column;
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        font-size: 16pt;
    }

    .ip {
        padding-left: 2em;
    }

    .entry {
        cursor: pointer;
        border: none;
        text-align: left;
        font-family: inherit;
        font-weight: inherit;
        font-size: inherit;
        display: flex;
        flex-direction: column;
        padding: 0 1em;
        background: inherit;
    }

    .net-name {
        position: sticky;
        top: 0px;
        background: inherit;
    }

    .selected,
    .entry:hover {
        background: #edff00;
    }
</style>
