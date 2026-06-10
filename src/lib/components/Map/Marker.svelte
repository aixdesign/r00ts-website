<script lang="ts">
    import type { Datacenter, Weather } from "$lib/types";
    import { markerState } from "./marker.svelte";

    let {
        zoom = 13,
        datacenter,
        weather = undefined,
        onclick,
    }: {
        zoom: number;
        datacenter: Datacenter;
        weather?: Weather;
        onclick: (e?: MouseEvent) => void;
    } = $props();

    let zoomed = $derived(zoom < 13);
    let no_preview = $derived(zoom < 5);
    let open = $derived(markerState.datacenter?.id == datacenter.id);
    let highlighted = $derived(
        markerState.highlighted.includes(datacenter.id) ||
            markerState.preview.includes(datacenter.id),
    );
</script>

<!-- class:marker-open={open && !zoomed} -->
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
                {#if weather}
                    <div class="weather">
                        {weather.temp}°C
                    </div>
                {/if}
            </div>
        {/if}
        {#if datacenter.filename && datacenter.precise && !no_preview}
            <img
                class="aerial"
                src="{import.meta.env
                    .BASE_URL}images/aerial/{datacenter.filename}"
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
        box-sizing: border-box;
        position: absolute;
        right: 0;
        bottom: 100%;
        width: 100%;
        background: #ff5f1f;
        padding: 0.8em;
        overflow: hidden;
    }

    h1 {
        font-size: 12pt;
        margin: 0 auto;
    }

    .weather {
        position: absolute;
        bottom: 100%;
        right: 0;
        padding: 0.4em 0.6em;
        background-color: white;
    }

    :global(.datacenter-marker) {
        z-index: 2;
        pointer-events: all;
    }

    :global(.datacenter-marker:has(.front)) {
        z-index: 10;
    }
</style>
