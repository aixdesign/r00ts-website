<script lang="ts">
    import { glyphState, glyphSize } from "./glyphState.svelte.ts";
    import { colourToString } from "./utils.ts";
    import { GLYPH_FUNCTIONS } from "./glyphRenderer.ts";

    let { rasteriser, mapBuildingsStyle, setBuildingStyle } = $props();

    let debugShow = $state(false);
</script>

<div
    id="debug-view"
    style="overflow: hidden; height: {debugShow ? null : '1em'};"
>
    <button onclick={() => (debugShow = !debugShow)}>
        {debugShow ? "Hide" : "Show"}
    </button>
    <div class="horizontal">
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
                        <input
                            type="color"
                            value={mapBuildingsStyle["layers"][0]["paint"][
                                "fill-color"
                            ]}
                            onchange={(ev) => {
                                const colour = ev.currentTarget.value;
                                mapBuildingsStyle["layers"][0]["paint"][
                                    "fill-color"
                                ] = colour;
                                mapBuildingsStyle["layers"][1]["paint"][
                                    "fill-color"
                                ] = colour;
                                setBuildingStyle(mapBuildingsStyle);
                            }}
                        />
                    </td>
                    <td></td>
                </tr>
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
            bind:value={glyphSize.value}
            oninput={() => {
                rasteriser?.setGlyphSize(glyphSize.value);
            }}
        />
        <span id="glyph-size-l">{glyphSize.value}</span>
    </label>
</div>

<style>
    #debug-view {
        position: fixed;
        bottom: 1.6em;
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
