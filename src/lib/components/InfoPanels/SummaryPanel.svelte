<script lang="ts">
    import type { Datacenter, Entry } from "$lib/types";

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
            </li>
        {/if}
        {#if num_datacenters > 0}
            <li>
                {num_datacenters == 1 ? "From" : "From up to"}
                <span class="datacenter-stat">
                    {num_datacenters}
                    {num_datacenters == 1 ? "datacenter" : "datacenters"}
                </span>
            </li>
            <li>
                {num_datacenters == 1 ? "In" : "Accross"}
                <span class="cities-stat"> {cities} </span>
            </li>
        {/if}
        {#if time < Infinity}
            <li>
                With the shortest connection taking <span class="time-stat"
                    >{time} milliseconds</span
                >
            </li>
        {/if}
        {#if time < 500}
            <li>
                Which means it is roughly
                <span class="distance-stat">
                    within a {distance}km radius
                </span>
                of your location
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
