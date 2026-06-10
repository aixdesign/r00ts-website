<script lang="ts">
    import { unmount, onDestroy, onMount } from "svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildingsStyle from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import { MapRaseriser } from "./glyphRenderer.ts";
    import { addMarker, markerState } from "./marker.svelte.ts";
    import DebugPanel from "./DebugPanel.svelte";
    import type { Datacenter, Weather } from "$lib/types";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map;
    let mapBuildingsLayer: maplibregl.Map;

    let mapCanvas: HTMLCanvasElement;
    let glyphOverlayCanvas: HTMLCanvasElement;

    let offscreenCanvas: OffscreenCanvas;
    let glyphPaletteCanvas: OffscreenCanvas;

    interface Props {
        zoom?: number;
        center?: [number, number];
        geoJSON?: any;
        datacenters?: Datacenter[];
        weatherData?: { [key: number]: Weather };
        glyphSize?: number;
        showDebug?: boolean;
        children?: any;
        leftPadding: number;
    }

    let {
        zoom = 2,
        center = [0, 0],
        datacenters,
        weatherData = {},
        glyphSize = 10,
        showDebug = false,
        leftPadding = 100,
        children,
    }: Props = $props();

    let datacenterMarkers: {
        marker: maplibregl.Marker;
        component: any;
        id: number;
    }[] = [];

    // svelte-ignore state_referenced_locally
    let zoomState = $state({ value: zoom });

    let rasteriser = $state<MapRaseriser | null>(null);

    function setBuildingStyle(style: maplibregl.StyleSpecification | string) {
        mapBuildingsLayer.setStyle(style, { diff: true });
    }

    function fitAll(animate: boolean = false) {
        if (datacenters?.length) {
            const bounds = datacenters.reduce((bounds, dc) => {
                return bounds.extend([dc.lon, dc.lat]);
            }, new maplibregl.LngLatBounds());

            let delay = markerState.datacenter == null ? 0 : 1000;
            markerState.datacenter = null;

            setTimeout(() => {
                map.fitBounds(bounds, {
                    maxZoom: 16,
                    padding: {
                        left: leftPadding,
                        right: 100,
                        top: 100,
                        bottom: 100,
                    },
                    animate,
                });
            }, delay);
        }
    }

    $effect(() => {
        if (markerState.datacenter == null) {
            map?.easeTo({ padding: { right: 0 }, duration: 1000 });
        } else {
            map?.flyTo({
                zoom: 16,
                center: [
                    markerState.datacenter.lon,
                    markerState.datacenter.lat,
                ],
                padding: { right: 350 },
                duration: 1000,
            });
        }
    });

    $effect(() => {
        if (markerState.highlighted?.length) {
            const bounds = new maplibregl.LngLatBounds();
            datacenterMarkers.map((dm) => {
                if (markerState.highlighted.includes(dm.id))
                    bounds.extend(dm.marker.getLngLat());
            });

            map.fitBounds(bounds, {
                maxZoom: 16,
                padding: {
                    left: leftPadding,
                    right: 100,
                    top: 100,
                    bottom: 100,
                },
            });
        }
    });

    onMount(() => {
        mapBuildingsLayer = new maplibregl.Map({
            container: mapBuildingsContainer,
            style: mapBuildingsStyle as maplibregl.StyleSpecification,
            center,
            zoom,
            interactive: false,
            attributionControl: false,
        });

        map = new maplibregl.Map({
            container: mapContainer,
            style: mapStyle as maplibregl.StyleSpecification,
            center,
            zoom,
            attributionControl: false,
        });

        syncMaps(map, mapBuildingsLayer);

        fitAll();

        mapCanvas = map.getCanvas();
        mapCanvas.style.opacity = "0";

        offscreenCanvas = new OffscreenCanvas(1, 1);
        glyphPaletteCanvas = new OffscreenCanvas(1, 1);

        // Setup Rasteriser
        rasteriser = new MapRaseriser(
            glyphOverlayCanvas,
            mapCanvas,
            offscreenCanvas,
            glyphPaletteCanvas,
            glyphSize,
        );

        // map.addControl(new maplibregl.NavigationControl());

        map.on("render", () => {
            rasteriser?.renderGlyphs();
        });

        map.on("load", () => {
            map.on("zoom", () => {
                zoomState.value = map.getZoom();
            });

            new ResizeObserver(() =>
                rasteriser?.resize(mapCanvas.width, mapCanvas.height),
            ).observe(mapCanvas);
        });

        map.on("click", () => {
            markerState.datacenter = null;
        });

        rasteriser?.resize(mapCanvas.width, mapCanvas.height);

        if (datacenters?.length) {
            datacenters.forEach((dc) => {
                datacenterMarkers.push(
                    addMarker(map, {
                        datacenter: dc,
                        weather: weatherData[dc.id],
                        zoomState,
                    }),
                );
            });
        }
    });

    onDestroy(() => {
        for (const { marker, component } of datacenterMarkers) {
            marker.remove();
            unmount(component);
        }
        map?.remove();
        mapBuildingsContainer?.remove();
    });
</script>

<div class="map-container">
    <div
        id="buildings-map"
        bind:this={mapBuildingsContainer}
        class="base-map map-overlay fill"
    ></div>

    <div bind:this={mapContainer} class="fill"></div>

    <canvas
        bind:this={glyphOverlayCanvas}
        class="map-overlay fill"
        id="glyph-render"
    >
    </canvas>
    {#if showDebug}
        <DebugPanel {rasteriser} {mapBuildingsStyle} {setBuildingStyle} />
    {/if}
    <button class="fit-btn" onclick={() => fitAll(true)}>fit all</button>
    {@render children?.()}
</div>

<style>
    .map-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .map-container .fill {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    #buildings-map {
        z-index: 1;
    }

    .map-overlay {
        pointer-events: none;
    }

    .fit-btn {
        position: absolute;
        top: 1em;
        right: 1em;
        border: none;
        cursor: pointer;
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        font-size: 16pt;
        z-index: 3;
    }
</style>
