<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import Button from "../Button.svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildingsStyle from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import type { Datacenter } from "$lib/types";
    import DebugPanel from "./DebugPanel.svelte";
    import { MapRaseriser } from "./glyphRenderer.ts";
    import { glyphSize } from "./glyphState.svelte.ts";
    import Marker from "./Marker.svelte";
    import { markerState } from "./marker.svelte.ts";

    import Tooltip from "../InfoPanels/Tooltip.svelte";
    import { TooltipPositions } from "../InfoPanels/tooltip.svelte.ts";

    import { addSticker, stickerState } from "./sticker.svelte.ts";
    import StickerPalette from "./StickerPalette.svelte";
    import {
        destroyLocationMarker,
        getUserLocation,
        showLocation,
    } from "./locationMarker.svelte.ts";
    import {
        CLUSTER_MAX_ZOOM,
        addClusterSource,
        toGeoJSON,
    } from "./clusterMarkers.ts";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map | null = $state.raw(null);
    let mapBuildingsLayer: maplibregl.Map | null = $state.raw(null);

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
        zoomOnLoad?: boolean;
        fitAll: (animate: boolean) => void;
    }

    let {
        zoom = 2,
        center = [0, 0],
        datacenters,
        showDebug = false,
        leftPadding = 100,
        fitAll = $bindable(),
        zoomOnLoad = false,
        children,
    }: Props = $props();

    // svelte-ignore state_referenced_locally
    let zoomState = $state({ value: zoom });
    let bounds: maplibregl.LngLatBounds = $state(new maplibregl.LngLatBounds());

    let rasteriser = $state<MapRaseriser | null>(null);

    function setBuildingStyle(style: maplibregl.StyleSpecification | string) {
        if (mapBuildingsLayer)
            mapBuildingsLayer.setStyle(style, { diff: true });
    }

    fitAll = (animate: boolean = false) => {
        if (!datacenters || !datacenters.length || !map) return;

        const bounds = datacenters.reduce((bounds, dc) => {
            return bounds.extend([dc.lon, dc.lat]);
        }, new maplibregl.LngLatBounds());

        markerState.datacenter = null;

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
    };

    $effect(() => {
        datacenters;
        const source = mapBuildingsLayer?.getSource("datacenters") as
            | maplibregl.GeoJSONSource
            | undefined;
        if (source && datacenters) source.setData(toGeoJSON(datacenters));
    });

    $effect(() => {
        if (!markerState.highlighted.length || !map) return;

        const bounds = new maplibregl.LngLatBounds();
        datacenters?.forEach((dc) => {
            if (markerState.highlighted.includes(dc.id))
                bounds.extend([dc.lon, dc.lat]);
        });

        map.fitBounds(bounds, {
            maxZoom: 16,
            padding: 100,
        });
    });

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer,
            style: mapStyle as maplibregl.StyleSpecification,
            center,
            zoom,
            interactive: false,
            attributionControl: false,
            maxCanvasSize: [8192, 8192],
        });

        mapBuildingsLayer = new maplibregl.Map({
            container: mapBuildingsContainer,
            style: mapBuildingsStyle as maplibregl.StyleSpecification,
            center,
            zoom,
            interactive: true,
            attributionControl: false,
        });

        syncMaps(mapBuildingsLayer, map);

        mapCanvas = map.getCanvas();
        mapCanvas.style.opacity = "0";
        mapCanvas.style.pointerEvents = "none";

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

        zoomState.value = map.getZoom();

        map.on("render", () => {
            rasteriser?.renderGlyphs();
        });

        mapBuildingsLayer.on("zoom", () => {
            if (!mapBuildingsLayer) return;

            let newZoom = mapBuildingsLayer.getZoom();

            if (markerState.datacenter && newZoom <= 13 && zoomState.value > 13)
                markerState.datacenter = null;

            markerState.largeMarker = zoomState.value > 13;

            const visible =
                zoomState.value >= CLUSTER_MAX_ZOOM ? "none" : "visible";
            const visible_cluster_labels =
                zoomState.value >= CLUSTER_MAX_ZOOM || zoomState.value < 3
                    ? "none"
                    : "visible";

            mapBuildingsLayer.setLayoutProperty(
                "clusters",
                "visibility",
                visible,
            );
            mapBuildingsLayer.setLayoutProperty(
                "cluster-count",
                "visibility",
                visible_cluster_labels,
            );
            mapBuildingsLayer.setLayoutProperty(
                "unclustered-point",
                "visibility",
                visible,
            );

            zoomState.value = newZoom;
        });

        mapBuildingsLayer.on("load", () => {
            if (mapBuildingsLayer) {
                addClusterSource(mapBuildingsLayer, datacenters ?? []);
            }
            new ResizeObserver(() => {
                rasteriser?.resize(mapCanvas.width, mapCanvas.height);
                if (map) bounds = map.getBounds();
            }).observe(mapCanvas);

            if (zoomOnLoad) fitAll(true);
        });

        mapBuildingsLayer.on("click", () => {
            markerState.datacenter = null;
        });

        mapBuildingsLayer.on("moveend", () => {
            if (map) bounds = map.getBounds();
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
        console.log("Map onDestroy");
        destroyLocationMarker();
        map?.remove();
        mapBuildingsLayer?.remove();
    });

    let visibleMarkers = $derived(
        zoomState.value >= CLUSTER_MAX_ZOOM && datacenters
            ? datacenters.filter((dc) => bounds.contains([dc.lon, dc.lat]))
            : [],
    );
</script>

<div class="map-container">
    <div bind:this={mapContainer} class="fill passive"></div>

    {#if mapBuildingsLayer}
        {#each visibleMarkers as dc (dc.id)}
            <Marker map={mapBuildingsLayer} datacenter={dc}></Marker>
        {/each}
    {/if}

    <canvas
        bind:this={glyphOverlayCanvas}
        class="map-overlay fill"
        id="glyph-render"
    >
    </canvas>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        id="buildings-map"
        bind:this={mapBuildingsContainer}
        class="base-map fill"
        {ondrop}
        {ondragover}
    ></div>

    {#if showDebug && rasteriser}
        <DebugPanel
            {rasteriser}
            {mapBuildingsStyle}
            {setBuildingStyle}
            {zoomState}
        />
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
                <p>Click on the marker on the map to remove it.</p>
            </Tooltip>
            <StickerPalette />
            {#if "geolocation" in navigator}
                <Button
                    highlight={showLocation.value}
                    onclick={() => {
                        if (!map) return;
                        const showingLocation = getUserLocation(map);
                        if (showingLocation) stickerState.placed = true;
                        else stickerState.placed = false;
                    }}
                >
                    Locate
                    {#if stickerState.loading}
                        <span class="loader"></span>
                    {/if}
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

    .map-container .passive {
        pointer-events: none;
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

    .loader {
        width: 1em;
        height: 1em;
        border: 3px solid #000;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1.4s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
