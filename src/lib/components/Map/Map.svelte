<script lang="ts">
    import { unmount, onDestroy, onMount } from "svelte";

    import maplibregl from "maplibre-gl";
    import "maplibre-gl/dist/maplibre-gl.css";

    import { syncMaps } from "./utils.ts";

    import mapBuildings from "./osm_buildings.json";
    import mapStyle from "./osm_surface.json";

    import { GLYPH_FUNCTIONS, MapRaseriser } from "./glyphRenderer.ts";
    import { glyphState } from "./glyphState.svelte.ts";
    import type { DatacenterInfo, Props } from "./types.ts";
    import { colourToString } from "./utils.ts";
    import { addMarker, clearActiveMarker } from "./marker.svelte.ts";

    let mapContainer: HTMLDivElement;
    let mapBuildingsContainer: HTMLDivElement;
    let map: maplibregl.Map;

    let mapCanvas: HTMLCanvasElement;
    let glyphOverlayCanvas: HTMLCanvasElement;

    // For debug view
    let offscreenCanvas: HTMLCanvasElement;
    let glyphPaletteCanvas: HTMLCanvasElement;

    let {
        zoom = 2,
        center = [0, 0],
        geoJSON,
        glyphSize = 10,
    }: Props = $props();

    let debugGlyphSize = $state(glyphSize);
    let debugShow = $state(false);

    let datacenterMarkers: {
        marker: maplibregl.Marker;
        component: any;
        zoomState: { value: number };
    }[] = [];

    let rasteriser: MapRaseriser;

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
            rasteriser.renderGlyphs();
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
                rasteriser.resize(mapCanvas.width, mapCanvas.height),
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

<div id="debug-view">
    <button onclick={() => (debugShow = !debugShow)}>
        {debugShow ? "Hide" : "Show"}
    </button>
    <div
        class="horizontal"
        style="overflow: hidden; height: {debugShow ? null : 0};"
    >
        <canvas
            bind:this={offscreenCanvas}
            class="debug-canvas"
            id="debug-canvas"
        ></canvas>
        <canvas bind:this={glyphPaletteCanvas} id="debug-glyphs"></canvas>

        <table>
            <tbody>
                {#each glyphState as gs}
                    <tr>
                        <td style="text-align: right;">{gs.label}</td>
                        <td
                            style="width: 1em; border: 1px solid black; background: {colourToString(
                                gs.rgb,
                            )}"
                        ></td>
                        <td>
                            <select
                                bind:value={gs.glyphName}
                                onchange={() => {
                                    rasteriser.refresh();
                                }}
                            >
                                {#each GLYPH_FUNCTIONS as gf}
                                    <option
                                        value={gf.name}
                                        selected={gf.name == gs.glyphName}
                                    >
                                        {gf.name}
                                    </option>
                                {/each}
                            </select>
                        </td>
                        <td>
                            <input
                                type="color"
                                onchange={() => {
                                    rasteriser.refresh();
                                }}
                                bind:value={gs.bg}
                            />
                        </td>
                        <td>
                            <input
                                type="color"
                                onchange={() => {
                                    rasteriser.refresh();
                                }}
                                bind:value={gs.fg}
                            />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <label>
        <input
            type="range"
            id="glyph-size"
            min="4"
            max="32"
            step="1"
            bind:value={debugGlyphSize}
            oninput={() => {
                rasteriser?.setGlyphSize(debugGlyphSize);
            }}
        />
        <span id="glyph-size-l">{debugGlyphSize}</span>
    </label>
</div>

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

    #debug-view {
        position: fixed;
        bottom: 0;
        padding: 1em;
        border: 1px red solid;
        z-index: 1000;
        background: white;
    }

    .horizontal {
        display: flex;
        align-items: center;
        gap: 1em;
        font-family: monospace;
        font-size: 8pt;
    }
</style>
