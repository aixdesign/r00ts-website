<script lang="ts">
    import type { Datacenter } from "$lib/types";
    import { dataState } from "./data.svelte";

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
                <span>Lat: {datacenter.lat}</span>
                <span>Lon: {datacenter.lon}</span>
            </div>
        {/if}
        <span>City: {datacenter.city}</span>
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
        background-color: #e7e7e7;
        padding: 1.5em;
        width: 350px;
        height: 100%;
        display: flex;
        flex-direction: column;
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
