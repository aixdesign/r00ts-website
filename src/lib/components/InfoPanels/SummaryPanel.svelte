<script lang="ts">
    import { resolve } from "$app/paths";
    import Button from "../Button.svelte";
    import { dataState } from "./data.svelte";
    import Tooltip from "./Tooltip.svelte";

    let num_ips = $derived(Object.keys(dataState.entries).length);
    let num_datacenters = $derived(dataState.datacenters.length);
    let cities = $derived.by(() => {
        let names = Array.from(
            new Set(dataState.datacenters.map((dc) => dc.city)),
        );

        if (names.length == 1) return names[0];

        if (names.length > 6) {
            const more = names.length - 5;
            names = names.slice(0, 5);
            names.push(`${more} more`);
        }

        let list = names.slice(0, -1).join(", ");
        list = `${list} and ${names.at(-1)}`;

        return list;
    });

    let submitButton: HTMLButtonElement | undefined = $state();

    let showSubmit = $state(true);

    const submitSessionAPI = resolve("/api/session");
    function submitSession() {
        if (submitButton) {
            submitButton.innerText = "Sending...";
            submitButton.disabled = true;
        }

        fetch(submitSessionAPI, {
            method: "POST",
            body: JSON.stringify({
                hostname: dataState.pageUrl,
                entries: dataState.entries,
                datacenter_ids: dataState.datacenters.map((e) => e.id),
            }),
        })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.innerText = "Thanks!";
                    setTimeout(() => {
                        showSubmit = false;
                    }, 2000);
                }
            });
    }
</script>

<div class="container">
    <span>
        {#if dataState.isSearchResults}
            users so far have found that
        {:else}
            your session on
        {/if}
        <br /> <em>{dataState.pageUrl ?? "the website"}</em>
        {#if dataState.isSearchResults}
            is
        {:else}
            was
        {/if}
        served by:
    </span>
    <ul>
        {#if num_ips > 0}
            <li>
                <span class="stat">
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
                <span class="stat">
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
                <span class="stat"> {cities} </span>
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
    </ul>
    {#if !dataState.isSearchResults && showSubmit}
        <Button bind:element={submitButton} onclick={submitSession}>
            Submit results
        </Button>
    {/if}
</div>

<style>
    .container {
        font-size: 22pt;
        position: absolute;
        bottom: 1em;
        left: 1em;
        max-width: 24em;
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    .stat {
        background: white;
    }
</style>
