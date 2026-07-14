<script lang="ts">
    import { glyphState, glyphSize } from "./glyphState.svelte.ts";
    import { colourToString } from "./utils.ts";
    import { GLYPH_FUNCTIONS, MapRaseriser } from "./glyphRenderer.ts";
    import { onMount } from "svelte";

    import { markerState } from "./marker.svelte.ts";

    interface Props {
        rasteriser: MapRaseriser;
        map: maplibregl.Map;
    }

    let { rasteriser, map }: Props = $props();

    let debugShow = $state(false);

    let glyphPalletteCanvas: HTMLCanvasElement;
    let offscreenCanvas: HTMLCanvasElement;

    let zoom = $state(2);

    let style: maplibregl.StyleSpecification | null = $state(null);
    let colorValue = $state("white");

    onMount(() => {
        rasteriser.setOffscreenCanvas(offscreenCanvas);
        rasteriser.rasterPalette.setGlyphPalletteCanvas(glyphPalletteCanvas);

        map.on("zoom", () => {
            zoom = map.getZoom();
        });

        map.on("load", () => {
            style = map.getStyle();

            style.layers.forEach((layer) => {
                if (layer.type !== "fill" || !layer.paint) return;

                colorValue =
                    (layer["paint"]["fill-color"] as string) ?? "white";
            });
        });
    });

    $effect(() => {
        if (!style) return;

        style.layers.forEach((layer) => {
            if (layer.type !== "fill" || !layer.paint) return;

            layer["paint"]["fill-color"] = colorValue;
        });

        map.setStyle(style, { diff: true });
    });
</script>

<div
    id="debug-view"
    style="overflow: hidden; height: {debugShow ? null : '1em'};"
>
    <button onclick={() => (debugShow = !debugShow)}>
        {debugShow ? "Hide" : "Show"}
    </button>
    <div class="horizontal">
        <canvas class="mapPreview" bind:this={offscreenCanvas}></canvas>
        <canvas class="glyphPreview" bind:this={glyphPalletteCanvas}></canvas>
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
                <tr>
                    <td style="text-align: right;">buildings</td>
                    <td></td>
                    <td></td>
                    <td>
                        <input type="color" bind:value={colorValue} />
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="horizontal">
        <label>
            <input
                type="range"
                id="glyph-size"
                min="4"
                max="32"
                step="1"
                bind:value={glyphSize.value}
                oninput={() => {
                    rasteriser?.setGlyphSize(glyphSize.value);
                }}
            />
            <span id="glyph-size-l">{glyphSize.value}</span>
        </label>
        <span> Current Zoom: {zoom.toFixed(2)}</span>
        <span>
            MarkerState: datacenter.id={markerState.datacenter?.id}
            largeMarker={markerState.largeMarker}
        </span>
    </div>
</div>

<style>
    canvas {
        image-rendering: pixelated;
    }

    .mapPreview {
        height: 200px;
    }

    .glyphPreview {
        height: 100px;
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
        font-size: 8pt;
    }
</style>
