<script lang="ts">
    import type { Datacenter } from "$lib/types";
    import { dataState } from "./data.svelte";
    import Tooltip from "./Tooltip.svelte";

    interface Props {
        datacenter: Datacenter;
    }

    let { datacenter }: Props = $props();

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
</script>

<div
    class="container"
    class:hidden={datacenter == null}
    class:animated={datacenter != null}
>
    <div class="panel">
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
                With the shortest connection taking
                <span class="time-stat">
                    {time} milliseconds
                </span>
                <Tooltip background="#ff5f1f">
                    <p>This was the round-trip fastest repsonse on an IP.</p>
                </Tooltip>
            </p>
        {/if}
        {#if time < 500}
            <p>
                Which means it is roughly
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
                        The speed of light in fibre optic is 200 kilometers per
                        milliseconds, so the distance is roughly how far light
                        can travel in half of the time the server responded
                        (since the total time includes there-and-back again).
                    </p>
                    <p>
                        We further refine this by dividing the time by 2 again
                        to account for the TLS handshake (which is an extra back
                        and forth)
                    </p>
                    <p>
                        Finally, we divide it again by 2 to roughly estimate the
                        time for the server to process the request.
                    </p>
                    <p>The final formula for estimating the distance is then</p>
                    <pre>  d = c * (t / 2) / 2 / 2</pre>
                    <p>
                        Where 'c = 200' and 't' is the server response time in
                        milliseconds.
                    </p>
                </Tooltip>
            </p>
        {/if}
        {#if ips.length > 0}
            <p>Potentially served:</p>
            <div class="ip-list">
                {#each ips as ip}
                    <span class="indent">{ip}</span>
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

    .animated {
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .container {
        position: absolute;
        top: 3em;
        left: 110%;
        z-index: 11;
        width: 350px;
        overflow: hidden;
    }

    .panel {
        position: relative;
        background-color: white;
        padding: 1.5em;
        width: 350px;
        height: 100%;
        box-sizing: border-box;
    }

    .hidden {
        width: 0px;
    }

    .indent {
        padding-left: 1em;
    }

    .ip-list {
        flex-grow: 2;
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
    }
</style>
