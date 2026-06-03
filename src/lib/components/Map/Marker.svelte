<script lang="ts">
    import type { Weather } from "$lib/types";

    let {
        url,
        name,
        zoom = 13,
        open = false,
        weather = undefined,
        loading = true,
        onclick,
    }: {
        id: number;
        url?: string;
        name: string;
        zoom: number;
        open: boolean;
        loading: boolean;
        weather?: Weather;
        onclick: (e?: MouseEvent) => void;
    } = $props();

    let zoomed = $derived(zoom < 13);
</script>

<div class="marker-root" class:front={open}>
    <div
        class="marker"
        class:marker-open={open}
        class:marker-small={zoomed}
        {onclick}
        role="button"
        tabindex="0"
        aria-label="Datacenter"
        onkeydown={(e) => e.key === "Enter" && onclick?.()}
    >
        <img
            class="aerial"
            src={url ? url : "img1.png"}
            alt="Aerial view of {name}"
        />
        {#if weather && open}
            <div class="weather">
                {weather.temp}°C
            </div>
        {/if}
    </div>
</div>

<style>
    .marker-root {
        position: relative;
        pointer-events: all;
    }

    .marker {
        height: 200px;
        width: 200px;
        transition-property: width, height !important;
        transition-duration: 1s !important;
        position: relative;
        cursor: pointer;
        z-index: 2;
    }

    .marker-open,
    .marker:hover {
        transform: scale(1.1);
    }

    .aerial {
        background-size: cover;
        height: 100%;
        border: 0.8em solid white;
        box-sizing: border-box;
    }

    .marker-small {
        width: 50px;
        height: 50px;
    }

    .weather {
        position: absolute;
        bottom: 100%;
        right: 0;
        padding: 0.4em 0.6em;
        background-color: white;
        font-family: sans-serif;
        font-size: 10pt;
        font-weight: 600;
    }

    :global(.datacenter-marker) {
        z-index: 2;
        pointer-events: all;
    }

    :global(.datacenter-marker:has(.front)) {
        z-index: 10;
    }
</style>
