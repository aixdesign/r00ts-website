<script lang="ts">
    import { unmount, onDestroy, onMount } from "svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildings from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import { MapRaseriser } from "./glyphRenderer.ts";
    import type { DatacenterInfo, Props } from "./types.ts";
    import { addMarker, clearActiveMarker } from "./marker.svelte.ts";
    import DebugPanel from "./DebugPanel.svelte";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map;

    let mapCanvas: HTMLCanvasElement;
    let glyphOverlayCanvas: HTMLCanvasElement;

    let offscreenCanvas: OffscreenCanvas;
    let glyphPaletteCanvas: OffscreenCanvas;

    let {
        zoom = 2,
        center = [0, 0],
        geoJSON,
        glyphSize = 10,
    }: Props = $props();

    let datacenterMarkers: {
        marker: maplibregl.Marker;
        component: any;
        zoomState: { value: number };
    }[] = [];

    let rasteriser = $state<MapRaseriser | null>(null);

    onMount(() => {
        const mapBuildingsLayer: maplibregl.Map = new maplibregl.Map({
            container: mapBuildingsContainer,
            style: mapBuildings as maplibregl.StyleSpecification,
        });

        map = new maplibregl.Map({
            container: mapContainer,
            style: mapStyle as maplibregl.StyleSpecification,
            center,
            zoom,
        });

        syncMaps(map, mapBuildingsLayer);

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

        map.addControl(new maplibregl.NavigationControl());

        map.on("render", () => {
            rasteriser?.renderGlyphs();
        });

        map.on("load", () => {
            map.on("zoom", () => {
                const zoom = map.getZoom();

                for (const { zoomState } of datacenterMarkers) {
                    zoomState.value = zoom;
                }
            });

            if (geoJSON) {
                geoJSON.data.features.forEach((ds: DatacenterInfo) => {
                    const { url, id } = ds.properties;
                    const { coordinates } = ds.geometry;

                    datacenterMarkers.push(
                        addMarker(map, {
                            lat: coordinates[1],
                            lng: coordinates[0],
                            url,
                            id,
                        }),
                    );
                });
            }

            new ResizeObserver(() =>
                rasteriser?.resize(mapCanvas.width, mapCanvas.height),
            ).observe(mapCanvas);
        });

        map.on("click", () => {
            clearActiveMarker();
        });
    });

    onDestroy(() => {
        for (const { marker, component } of datacenterMarkers) {
            marker.remove();
            unmount(component);
        }
        map?.remove();
    });
</script>

<div bind:this={mapBuildingsContainer} class="base-map map-overlay"></div>
<div bind:this={mapContainer} class="map-container"></div>
<canvas bind:this={glyphOverlayCanvas} class="map-overlay" id="glyph-render">
</canvas>

<DebugPanel {rasteriser} />

<style>
    .map-container {
        height: 100vh;
    }

    .map-overlay {
        position: absolute;
        pointer-events: none;
        top: 0;
    }

    .base-map {
        width: 100vw;
        height: 100vh;
        opacity: 1;
        position: absolute;
        z-index: 1;
    }
</style>
