<script lang="ts">
    import type { Datacenter, Entry } from "$lib/types";
    import Tooltip from "./Tooltip.svelte";

    interface Props {
        entries: { [key: string]: Entry };
        datacenters: Datacenter[];
        pageUrl?: string;
    }

    let { entries, datacenters, pageUrl }: Props = $props();

    let num_ips = $derived(Object.keys(entries).length);
    let num_datacenters = $derived(datacenters.length);
    let cities = $derived.by(() => {
        const names = Array.from(new Set(datacenters.map((dc) => dc.city)));

        if (names.length == 1) return names[0];

        let list = names.slice(0, -1).join(", ");
        list = `${list} and ${names.at(-1)}`;

        return list;
    });

    let time = $derived(
        Object.values(entries).reduce((p, e) => {
            return Math.min(e.durationMs ?? Infinity, p);
        }, Infinity),
    );

    // VERY rough upper-bound estimate of distance to server:
    //   c = 200 km/ms (light in fibre optic)
    //   t (time in ms of request TTFB)
    //   d = (t/2) * c / 2 / 2
    //          ^        ^   ^-- new TLS handshake takes back-and-forth
    //          |        '------ server overhead roughly doubles TTFB
    //          '--------------- there and back again
    // still useful for estimating continent hops
    const c = 200;
    let distance = $derived(((time / 2) * c) / 2 / 2);
</script>

<div class="container">
    <span>{pageUrl ?? "The website"} was served by:</span>
    <ul>
        {#if num_ips > 0}
            <li>
                <span class="ip-stat">
                    {num_ips} IP {num_ips > 1 ? "addresses" : "address"}
                </span>
                <Tooltip colour="yellow">
                    <h2>Why so many IP addresses for this website?</h2>
                    <p>
                        Webpages can be made from many different components,
                        media etc that may be served from different services:
                        images might be stored in a different server than the
                        text content, or the fonts are loaded from a Google
                        service, or there is an ad network etc.
                    </p>
                </Tooltip>
            </li>
        {/if}
        {#if num_datacenters > 0}
            <li>
                {num_datacenters == 1 ? "From" : "From up to"}
                <span class="datacenter-stat">
                    {num_datacenters}
                    {num_datacenters == 1 ? "datacenter" : "datacenters"}
                </span>
                <Tooltip colour="cyan">
                    <h2>Why so many datacenters?</h2>
                    <p>
                        It is hard to know exactly which datacenter serves which
                        IP block, so we provide our best estimate for which
                        facilities might be the real one that you connected to.
                    </p>
                </Tooltip>
            </li>
            <li>
                {num_datacenters == 1 ? "In" : "Across"}
                <span class="cities-stat"> {cities} </span>
            </li>
        {/if}
        {#if time < Infinity}
            <li>
                With the shortest connection taking
                <span class="time-stat">
                    {time} milliseconds
                </span>
                <Tooltip colour="#ff5f1f">
                    <p>This was the round-trip fastest repsonse on an IP.</p>
                </Tooltip>
            </li>
        {/if}
        {#if time < 500}
            <li>
                Which means it is roughly
                <span class="distance-stat">
                    within a {distance}km radius
                </span>
                of your location
                <Tooltip colour="#ff70b3">
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
            </li>
        {/if}
    </ul>
</div>

<style>
    .container {
        position: absolute;
        bottom: 2em;
        left: 1em;
        max-width: 24em;
        background: #e7e7e7;
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    .ip-stat {
        background: yellow;
    }

    .datacenter-stat {
        background: cyan;
    }

    .cities-stat {
        background: #8ff0a4;
    }

    .time-stat {
        background: #ff5f1f;
    }

    .distance-stat {
        background: #ff70b3;
    }
</style>
