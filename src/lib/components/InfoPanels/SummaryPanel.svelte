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
    // const c = 200;
    // let distance = $derived(((time / 2) * c) / 2 / 2);
</script>

<div class="container">
    <span>
        your session on <em>{pageUrl ?? "the website"}</em> was served by:
    </span>
    <ul>
        {#if num_ips > 0}
            <li>
                <span class="ip-stat">
                    {num_ips} IP {num_ips > 1 ? "addresses" : "address"}
                </span>
                <Tooltip background="yellow">
                    <h2>Why so many IP addresses?</h2>
                    <p>It turns out a webpage isn't rooted in one place.</p>
                    <p>
                        It's made up of many elements — text, images, fonts,
                        dynamic bits like this map — and each element can come
                        from a different service. The words might load from one
                        server, the images from another, the fonts from Google,
                        this map from OpenStreetMap.
                    </p>
                    <p>Each one of those can have its own IP address.</p>
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
                <Tooltip background="cyan">
                    <h2>Why so many data centers?</h2>
                    <p>
                        Tracing an IP address to one datacenter is tricky, but
                        here's what we know so far: some of these IP addresses
                        bring us to this location, and this location is home to
                        {num_datacenters} data centers. Any of them could be supporting
                        this website.
                    </p>
                </Tooltip>
            </li>
            <li>
                {num_datacenters == 1 ? "In" : "Across"}
                <span class="cities-stat"> {cities} </span>
                <Tooltip background="#8ff0a4">
                    <h2>Why so many cities?</h2>
                    <p>
                        Every IP address offers clues about where it's rooted —
                        a bit like a postcode. These clues have lead us to these
                        cities.
                    </p>
                </Tooltip>
            </li>
        {/if}
        <!-- {#if time < Infinity} -->
        <!--     <li> -->
        <!--         With the shortest connection taking -->
        <!--         <span class="time-stat"> -->
        <!--             {time} milliseconds -->
        <!--         </span> -->
        <!--         <Tooltip colour="#ff5f1f"> -->
        <!--             <p>This was the round-trip fastest repsonse on an IP.</p> -->
        <!--         </Tooltip> -->
        <!--     </li> -->
        <!-- {/if} -->
        <!-- {#if time < 500} -->
        <!--     <li> -->
        <!--         Which means it is roughly -->
        <!--         <span class="distance-stat"> -->
        <!--             within a {distance}km radius -->
        <!--         </span> -->
        <!--         of your location -->
        <!--         <Tooltip colour="#ff70b3"> -->
        <!--             <h2>How is this estimated?</h2> -->
        <!--             <p> -->
        <!--                 This is a <i>very</i> rough estimate of maximum distance -->
        <!--                 the data center must be, based on how quickly it responded -->
        <!--                 to a request. -->
        <!--             </p> -->
        <!--             <p> -->
        <!--                 The speed of light in fibre optic is 200 kilometers per -->
        <!--                 milliseconds, so the distance is roughly how far light -->
        <!--                 can travel in half of the time the server responded -->
        <!--                 (since the total time includes there-and-back again). -->
        <!--             </p> -->
        <!--             <p> -->
        <!--                 We further refine this by dividing the time by 2 again -->
        <!--                 to account for the TLS handshake (which is an extra back -->
        <!--                 and forth) -->
        <!--             </p> -->
        <!--             <p> -->
        <!--                 Finally, we divide it again by 2 to roughly estimate the -->
        <!--                 time for the server to process the request. -->
        <!--             </p> -->
        <!--             <p>The final formula for estimating the distance is then</p> -->
        <!--             <pre>  d = c * (t / 2) / 2 / 2</pre> -->
        <!--             <p> -->
        <!--                 Where 'c = 200' and 't' is the server response time in -->
        <!--                 milliseconds. -->
        <!--             </p> -->
        <!--         </Tooltip> -->
        <!--     </li> -->
        <!-- {/if} -->
    </ul>
</div>

<style>
    .container {
        position: absolute;
        bottom: 2em;
        left: 1em;
        max-width: 24em;
        background: white;
        display: flex;
        flex-direction: column;
        z-index: 10;
    }
</style>
