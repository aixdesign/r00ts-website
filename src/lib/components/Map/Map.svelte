<script lang="ts">
    import { unmount, onDestroy, onMount } from "svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildingsStyle from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import { MapRaseriser } from "./glyphRenderer.ts";
    import type { Props } from "./types.ts";
    import { addMarker, markerState } from "./marker.svelte.ts";
    import DebugPanel from "./DebugPanel.svelte";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map;
    let mapBuildingsLayer: maplibregl.Map;

    let mapCanvas: HTMLCanvasElement;
    let glyphOverlayCanvas: HTMLCanvasElement;

    let offscreenCanvas: OffscreenCanvas;
    let glyphPaletteCanvas: OffscreenCanvas;

    let {
        zoom = 2,
        center = [0, 0],
        datacenters,
        weatherData = {},
        glyphSize = 10,
        showDebug = false,
        children,
    }: Props = $props();

    let datacenterMarkers: {
        marker: maplibregl.Marker;
        component: any;
        zoomState: { value: number };
    }[] = [];

    let rasteriser = $state<MapRaseriser | null>(null);

    function setBuildingStyle(style: maplibregl.StyleSpecification | string) {
        mapBuildingsLayer.setStyle(style, { diff: true });
    }

    $effect(() => {
        if (markerState.activeId == null || markerState.datacenter == null) {
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

    onMount(() => {
        mapBuildingsLayer = new maplibregl.Map({
            container: mapBuildingsContainer,
            style: mapBuildingsStyle as maplibregl.StyleSpecification,
            center,
            zoom,
            interactive: false,
        });

        map = new maplibregl.Map({
            container: mapContainer,
            style: mapStyle as maplibregl.StyleSpecification,
            center,
            zoom,
        });

        syncMaps(map, mapBuildingsLayer);

        if (datacenters?.length) {
            const bounds = datacenters.reduce((bounds, dc) => {
                return bounds.extend([dc.lon, dc.lat]);
            }, new maplibregl.LngLatBounds());

            map.fitBounds(bounds, {
                maxZoom: 14,
                padding: 30,
                animate: false,
            });
        }

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

            new ResizeObserver(() =>
                rasteriser?.resize(mapCanvas.width, mapCanvas.height),
            ).observe(mapCanvas);
        });

        map.on("click", () => {
            markerState.activeId = null;
        });

        rasteriser?.resize(mapCanvas.width, mapCanvas.height);

        if (datacenters?.length) {
            datacenters.forEach((dc) => {
                datacenterMarkers.push(
                    addMarker(map, {
                        datacenter: dc,
                        weather: weatherData[dc.id],
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
</style>
