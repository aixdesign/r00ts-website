<script lang="ts">
    import { resolve } from "$app/paths";
    import { untrack } from "svelte";

    import type { Datacenter, Weather } from "$lib/types";

    import maplibregl from "maplibre-gl";
    import DataPanel from "../InfoPanels/DataPanel.svelte";
    import WeatherComponent from "./WeatherComponent.svelte";
    import { markerState, selectDatacenter } from "./marker.svelte";

    let {
        map,
        datacenter,
    }: {
        map: maplibregl.Map;
        datacenter: Datacenter;
    } = $props();

    let el: HTMLDivElement;

    $effect(() => {
        const marker = untrack(() => {
            return new maplibregl.Marker({ element: el })
                .setLngLat([datacenter.lon, datacenter.lat])
                .addTo(map);
        });

        return () => marker.remove();
    });

    let open = $derived(markerState.datacenter?.id == datacenter.id);
    let highlighted = $derived(
        markerState.highlighted.includes(datacenter.id) ||
            markerState.preview.includes(datacenter.id),
    );

    const aerialAPI = resolve("/api/aerial/");
    const weatherAPI = resolve("/api/weather");

    const aerial_url: string = resolve("/images/aerial/");

    // svelte-ignore state_referenced_locally
    let aerial_filename = $state(datacenter.filename);

    let weather: Weather | null = $state(null);

    function onclick(ev?: MouseEvent) {
        ev?.stopPropagation();

        selectDatacenter(map, datacenter);

        if (datacenter.filename == null && datacenter.precise) {
            fetch(`${aerialAPI}${datacenter.id}`)
                .then((res) => res.json())
                .then((data) => {
                    datacenter.filename = data.filename;
                    aerial_filename = data.filename;
                })
                .catch((err) => {
                    console.error(err);
                });
        }

        if (weather == null) {
            fetch(weatherAPI, {
                method: "POST",
                body: JSON.stringify({
                    id: datacenter.id,
                    lat: datacenter.lat,
                    lon: datacenter.lon,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.message) throw new Error(data.message);

                    weather = data;
                })
                .catch((_err) => {
                    console.error(
                        `Error fetching weather for ${datacenter.lat} ${datacenter.lon} `,
                    );
                });
        }
    }

    function onwheel(e: WheelEvent) {
        e.preventDefault();
        queueMicrotask(() => {
            try {
                map.getCanvasContainer().dispatchEvent(e);
            } catch (error) {}
        });
    }
</script>

<div bind:this={el} {onwheel}>
    <div class="marker-root" class:front={open}>
        <div
            class="marker"
            class:marker-small={!markerState.largeMarker}
            class:highlighted
            {onclick}
            role="button"
            tabindex="0"
            aria-label="Datacenter"
            onkeydown={(e) => e.key === "Enter" && onclick?.()}
        >
            {#if open}
                <div class="title" class:highlighted>
                    <WeatherComponent {weather} />
                    <h1>{datacenter.name}</h1>
                </div>

                <DataPanel {datacenter} />
            {/if}
            {#if aerial_filename && datacenter.precise}
                <img
                    class="aerial"
                    src="{aerial_url}{aerial_filename}"
                    alt="Aerial view of {datacenter.name}"
                />
            {:else if open && !datacenter.precise && markerState.largeMarker}
                <div class="caption">
                    <span>
                        Exact location unknown! All we know is that it is in <em
                        >
                            {datacenter.city}
                        </em>. Help us find it's exact address!
                    </span>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .marker-root {
        font-family: "GT Pressura Mono", monospace;
        font-weight: lighter;
        position: relative;
        pointer-events: all;
    }

    .marker {
        max-height: 350px;
        max-width: 350px;
        background: #ff70b3;
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
        padding: 0.6em;
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
        background: inherit;
        padding: 0.8em;
        padding-bottom: 0;
        overflow: hidden;
    }

    h1 {
        font-size: 12pt;
        margin: 0;
        text-align: right;
        font-weight: lighter;
    }

    :global(.datacenter-marker) {
        z-index: 2;
        pointer-events: all;
    }

    :global(.datacenter-marker:has(.front)) {
        z-index: 10;
    }
</style>
