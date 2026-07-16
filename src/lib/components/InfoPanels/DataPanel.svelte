<script lang="ts">
    import type { Datacenter, Network } from "$lib/types";
    import { dataState } from "./data.svelte";
    import { markerState } from "../Map/marker.svelte";
    import Tooltip from "./Tooltip.svelte";
    import { padIp } from "$lib/ip_utils";
    import { onDestroy, onMount } from "svelte";

    interface Props {
        map: maplibregl.Map | null;
        datacenter: Datacenter;
    }

    let { map, datacenter }: Props = $props();

    let networks: Network[] = $derived.by(() => {
        if (datacenter.id == undefined) return [];

        if (markerState.networks.length) {
            return markerState.networks;
        }

        if (!dataState.networks || !dataState.networksDatacenters) {
            return [];
        }

        let network_list: Network[] = [];
        for (const [network_id, datacenters] of Object.entries(
            dataState.networksDatacenters,
        )) {
            if (datacenters.includes(datacenter.id))
                network_list.push(dataState.networks[parseInt(network_id)]);
        }
        return network_list;
    });

    let ips = $derived.by(() => {
        if (
            datacenter.id == undefined ||
            !dataState.entries ||
            !dataState.networksDatacenters
        )
            return [];

        let ip_list: string[] = [];
        for (const [ip, entry] of Object.entries(dataState.entries)) {
            const { network_id } = entry;
            if (network_id == undefined) continue;

            if (
                dataState.networksDatacenters[network_id]?.includes(
                    datacenter.id,
                )
            )
                ip_list.push(ip);
        }
        return ip_list;
    });

    let time = $derived.by(() => {
        if (
            datacenter.id == undefined ||
            !dataState.entries ||
            !dataState.networksDatacenters
        )
            return Infinity;

        let t = Infinity;
        for (const entry of Object.values(dataState.entries)) {
            const { network_id } = entry;
            if (network_id == undefined) continue;

            if (
                dataState.networksDatacenters[network_id]?.includes(
                    datacenter.id,
                )
            )
                t = Math.min(entry.durationMs ?? Infinity, t);
        }

        return t;
    });

    const c = 200;
    let distance = $derived(((time / 2) * c) / 2 / 2);

    // VERY rough upper-bound estimate of distance to server:
    //   c = 200 km/ms (light in fibre optic)
    //   t (time in ms of request TTFB)
    //   d = (t/2) * c / 2 / 2
    //          ^        ^   ^-- new TLS handshake takes back-and-forth
    //          |        '------ server overhead roughly doubles TTFB
    //          '--------------- there and back again
    // still useful for estimating continent hops

    let containerEl: HTMLDivElement;
    let panelEl: HTMLDivElement;

    function positionElement() {
        if (!datacenter || !map || !containerEl) return;

        const pos = map.project([datacenter.lon, datacenter.lat]);
        containerEl.style.left = pos.x + "px";
        containerEl.style.top = pos.y + "px";
    }

    onMount(() => {
        map?.on("move", positionElement);
        positionElement();
    });

    onDestroy(() => {
        map?.off("move", positionElement);
    });
</script>

<div bind:this={containerEl} class="container">
    <div bind:this={panelEl} class="panel">
        {#if datacenter.links?.length}
            <h1>
                <a href={datacenter.links[0]} rel="noopener" target="_blank">
                    {datacenter.name}
                </a>
            </h1>
        {:else}
            <h1>{datacenter.name}</h1>
        {/if}
        {#if datacenter.precise}
            <div>
                <a
                    href="https://maps.google.com/maps?q=&layer=c&cbll={datacenter.lat},{datacenter.lon}"
                    target="_blank"
                    rel="noopener"
                    title="Open in Google Street view (new window)"
                >
                    <span>Lat: {datacenter.lat}</span>
                    <span>Lon: {datacenter.lon}</span>
                </a>
            </div>
        {/if}
        <p>City: {datacenter.city}</p>
        {#if time != Infinity}
            <p>
                The shortest connection took
                <span class="time-stat">
                    {time} milliseconds
                </span>
                <Tooltip background="#ff5f1f">
                    <p>
                        This was the round-trip fastest repsonse on an IP
                        potentially served by this datacenter.
                    </p>
                </Tooltip>
                {#if time < 500}
                    which means it is roughly
                    <span class="distance-stat">
                        within a {distance}km radius
                    </span>
                    of your location
                    <Tooltip background="#ff70b3">
                        <h2>How is this estimated?</h2>
                        <p>
                            This is a <i>very</i> rough estimate of maximum distance
                            the data center must be, based on how quickly it responded
                            to a request.
                        </p>
                        <p>
                            The speed of light in fibre optic cable is 200
                            kilometers per milliseconds, so the distance is
                            roughly how far light can travel in half of the time
                            the server responded (since the total time includes
                            there-and-back again).
                        </p>
                        <p>
                            We further refine this by dividing the time by 2
                            again to account for the TLS handshake (which is an
                            extra back and forth), and finally we divide it
                            again by 2 to roughly estimate the time for the
                            server to process the request.
                        </p>
                        <p>
                            The final formula for estimating the distance is
                            then
                        </p>
                        <pre>  d = 200 * (t / 2) / 2 / 2</pre>
                    </Tooltip>
                {/if}
            </p>
        {/if}
        {#if networks.length}
            <!-- This datacenter is {networksString}. -->
            <p>Networks registered to this center:</p>
            <div class="ip-list">
                {#each networks as network}
                    <a
                        href="https://www.peeringdb.com/net/{network.net_id}"
                        target="_blank"
                        class="indent"
                    >
                        {network.network_name}
                    </a>
                {/each}
            </div>
        {/if}
        {#if ips.length > 0}
            <p>Potentially served:</p>
            <div class="ip-list">
                {#each ips as ip}
                    <span class="indent">{padIp(ip)}</span>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    a {
        color: blue;
    }

    a:visited {
        color: blue;
    }

    .container {
        position: absolute;
        z-index: 3;
        width: 350px;
    }

    .panel {
        position: absolute;
        left: 200px;
        top: -100px;
        background-color: white;
        padding: 1.5em;
        width: 350px;
        box-sizing: border-box;
    }

    .indent {
        padding-left: 1em;
    }

    .ip-list {
        flex-grow: 2;
        overflow-y: scroll;
        max-height: 200px;
        display: flex;
        flex-direction: column;
        white-space-collapse: preserve-spaces;
    }

    @media (width < 720px) {
        .panel {
            top: 200px;
            left: -50%;
        }
    }
</style>
