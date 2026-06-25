<script lang="ts">
    import { unmount, onDestroy, onMount } from "svelte";

    import Button from "../Button.svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildingsStyle from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import { MapRaseriser } from "./glyphRenderer.ts";
    import { addMarker, markerState } from "./marker.svelte.ts";
    import DebugPanel from "./DebugPanel.svelte";
    import type { Datacenter } from "$lib/types";
    import { glyphSize } from "./glyphState.svelte.ts";

    import {
        destroyLocationMarker,
        getUserLocation,
        showLocation,
    } from "./locationMarker.svelte.ts";
    import StickerPalette from "./StickerPalette.svelte";
    import { addSticker, stickerState } from "./sticker.svelte.ts";
    import Tooltip from "../InfoPanels/Tooltip.svelte";
    import { TooltipPositions } from "../InfoPanels/tooltip.svelte.ts";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map | null = $state.raw(null);
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
        showDebug?: boolean;
        children?: any;
        leftPadding: number;
    }

    let {
        zoom = 2,
        center = [0, 0],
        datacenters,
        showDebug = false,
        leftPadding = 100,
        children,
    }: Props = $props();

    let datacenterMarkers: Map<
        number,
        {
            marker: maplibregl.Marker;
            component: any;
            id: number;
        }
    > = new Map();

    // svelte-ignore state_referenced_locally
    let zoomState = $state({ value: zoom });

    let rasteriser = $state<MapRaseriser | null>(null);

    function setBuildingStyle(style: maplibregl.StyleSpecification | string) {
        mapBuildingsLayer.setStyle(style, { diff: true });
    }

    function fitAll(animate: boolean = false) {
        if (!datacenters) return;

        const bounds = datacenters.reduce((bounds, dc) => {
            return bounds.extend([dc.lon, dc.lat]);
        }, new maplibregl.LngLatBounds());

        markerState.datacenter = null;

        map?.fitBounds(bounds, {
            maxZoom: 16,
            padding: {
                left: leftPadding,
                right: 100,
                top: 100,
                bottom: 100,
            },
            animate,
        });
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
                duration: 1000,
            });
        }
    });

    $effect(() => {
        if (markerState.highlighted?.length) {
            const bounds = new maplibregl.LngLatBounds();
            datacenterMarkers.forEach((dm) => {
                if (markerState.highlighted.includes(dm.id))
                    bounds.extend(dm.marker.getLngLat());
            });

            map?.fitBounds(bounds, {
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
            glyphSize.value,
        );

        map.on("render", () => {
            rasteriser?.renderGlyphs();
        });

        map.on("zoom", () => {
            if (map) zoomState.value = map.getZoom();
        });

        map.on("load", () => {
            new ResizeObserver(() =>
                rasteriser?.resize(mapCanvas.width, mapCanvas.height),
            ).observe(mapCanvas);
        });

        map.on("click", () => {
            markerState.datacenter = null;
        });

        rasteriser?.resize(mapCanvas.width, mapCanvas.height);
    });

    export function getMap() {
        return map;
    }

    function ondragover(e: MouseEvent) {
        e.preventDefault();
    }

    function ondrop(e: DragEvent) {
        e.preventDefault();

        if (!map) return;

        const data = e.dataTransfer?.getData("text/plain");

        const mapRect = mapContainer.getBoundingClientRect();
        const point = new maplibregl.Point(
            e.clientX - mapRect.left,
            e.clientY - mapRect.top,
        );

        const lngLat = map.unproject(point);
        onMarkerDropped(lngLat, data);
    }

    function onMarkerDropped(point: maplibregl.LngLat, data?: string) {
        if (!map) return;

        const sticker = addSticker(map, point, data);
        stickerState.locationMarker = sticker.marker;
    }

    onDestroy(() => {
        destroyLocationMarker();
        datacenterMarkers.forEach(({ marker, component }) => {
            marker.remove();
            unmount(component);
        });
        map?.remove();
        mapBuildingsLayer?.remove();
    });

    $effect(() => {
        if (!map) return;

        const incoming = new Set(datacenters?.map((dc) => dc.id));

        for (const [id, dcm] of datacenterMarkers) {
            if (incoming.has(id)) continue;
            unmount(dcm.component);
            dcm.marker.remove();
            datacenterMarkers.delete(id);
        }

        if (datacenters)
            for (const dc of datacenters) {
                const { marker, component } = addMarker(map, {
                    datacenter: dc,
                    zoomState,
                });
                datacenterMarkers.set(dc.id, { marker, component, id: dc.id });
            }

        fitAll();
    });
</script>

<div class="map-container">
    <div
        id="buildings-map"
        bind:this={mapBuildingsContainer}
        class="base-map map-overlay fill"
    ></div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div bind:this={mapContainer} class="fill" {ondrop} {ondragover}></div>

    <canvas
        bind:this={glyphOverlayCanvas}
        class="map-overlay fill"
        id="glyph-render"
    >
    </canvas>
    {#if showDebug && rasteriser}
        <DebugPanel {rasteriser} {mapBuildingsStyle} {setBuildingStyle} />
    {/if}

    <div class="controls">
        <Button onclick={() => fitAll(true)}>Fit all</Button>
        <div class="horizontal">
            <Tooltip position={TooltipPositions.UPPER_LEFT}>
                <p>
                    Drag the sticker to indicate your location, or click
                    "Locate" to estimate your location.
                </p>
                <p>
                    This uses your browser's location services, which requires
                    your permission, and might not be accurate on desktop.
                </p>
            </Tooltip>
            {#if "geolocation" in navigator}
                <Button
                    highlight={showLocation.value}
                    onclick={() => {
                        if (!map) return;
                        const showingLocation = getUserLocation(map);
                        if (showingLocation)
                            stickerState.avaliable.delete("bug");
                        else stickerState.avaliable.add("bug");
                    }}
                >
                    <StickerPalette />
                    Locate
                </Button>
            {/if}
        </div>
    </div>
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

    :global(.maplibregl-marker) {
        z-index: 3;
    }

    #buildings-map {
        z-index: 1;
    }

    .map-overlay {
        pointer-events: none;
    }

    .controls {
        position: absolute;
        bottom: 1em;
        right: 1em;
        display: flex;
        flex-direction: column;
        align-items: end;
        z-index: 5;
    }

    .horizontal {
        display: flex;
        align-items: center;
    }
</style>
