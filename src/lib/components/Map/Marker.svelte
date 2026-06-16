<script lang="ts">
    import { resolve } from "$app/paths";
    import WeatherComponent from "./WeatherComponent.svelte";
    import type { Datacenter, Weather } from "$lib/types";
    import { markerState } from "./marker.svelte";
    import DataPanel from "../InfoPanels/DataPanel.svelte";

    let {
        zoom = 13,
        datacenter,
        weather = null,
        onclick,
    }: {
        zoom: number;
        datacenter: Datacenter;
        weather: Weather | null;
        onclick: (e?: MouseEvent) => void;
    } = $props();

    let zoomed = $derived(zoom < 13);
    let no_preview = $derived(zoom < 5);
    let open = $derived(markerState.datacenter?.id == datacenter.id);
    let highlighted = $derived(
        markerState.highlighted.includes(datacenter.id) ||
            markerState.preview.includes(datacenter.id),
    );

    const aerial_url: string = resolve("/images/aerial/");
</script>

<div class="marker-root" class:front={open}>
    <div
        class="marker"
        class:marker-small={zoomed}
        class:highlighted
        {onclick}
        role="button"
        tabindex="0"
        aria-label="Datacenter"
        onkeydown={(e) => e.key === "Enter" && onclick?.()}
    >
        {#if open && !zoomed}
            <div class="title" class:highlighted>
                <h1>{datacenter.name}</h1>
                <WeatherComponent {weather} />
            </div>

            <DataPanel {datacenter} />
        {/if}
        {#if datacenter.filename && datacenter.precise && !no_preview}
            <img
                class="aerial"
                src="{aerial_url}{datacenter.filename}"
                alt="Aerial view of {datacenter.name}"
            />
        {:else if open && !datacenter.precise && !zoomed && !no_preview}
            <div class="caption">
                <span>
                    Exact location unknown! All we know is that it is in <em
                        >{datacenter.city}</em
                    >. Help us find it's address!
                </span>
            </div>
        {/if}
    </div>
</div>

<style>
    .marker-root {
        font-family: "Jetbrains Mono", monospace;
        position: relative;
        pointer-events: all;
    }

    .marker {
        max-height: 350px;
        max-width: 350px;
        background: #ff5f1f;
        padding: 0.8em;
        transition-property: max-width, max-height, min-width !important;
        transition-duration: 1s !important;
        position: relative;
        cursor: pointer;
        z-index: 2;
    }

    .aerial {
        background-size: cover;
        height: 100%;
        box-sizing: border-box;
    }

    img {
        width: 100%;
    }

    .caption {
        width: 100%;
        height: 100%;
    }

    .marker-small {
        max-width: 50px;
        max-height: 50px;
    }

    .highlighted {
        background: yellow !important;
    }

    .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
        position: absolute;
        right: 0;
        bottom: 100%;
        width: 100%;
        background: #ff5f1f;
        padding: 0.8em;
        padding-bottom: 0;
        overflow: hidden;
    }

    h1 {
        font-size: 12pt;
        margin: 0;
    }

    :global(.datacenter-marker) {
        z-index: 2;
        pointer-events: all;
    }

    :global(.datacenter-marker:has(.front)) {
        z-index: 10;
    }
</style>
