<script lang="ts">
    import { onMount } from "svelte";
    import { GLYPH_FUNCTIONS } from "../Map/glyphRenderer";
    import { glyphState } from "../Map/glyphState.svelte";

    const canvases: { [key: string]: HTMLCanvasElement } = {};
    const size = 12;

    onMount(() => {
        for (const element of glyphState) {
            const drawFun = GLYPH_FUNCTIONS.find(
                (el) => el.name === element.glyphName,
            );

            if (!drawFun) continue;

            const ctx = canvases[element.glyphName].getContext("2d");
            if (ctx == null) {
                console.log("2d context not created");
                continue;
            }

            const fg = "black";
            let bg = "white";

            if (element.glyphName === "blank") bg = fg;

            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, size, size);

            drawFun.fn(ctx, size, fg);
        }
    });
</script>

<div class="container">
    {#each glyphState as gs}
        <span>
            <canvas
                height="{size}px"
                width="{size}px"
                bind:this={canvases[gs.glyphName]}
            ></canvas>{gs.label}
        </span>
    {/each}
</div>

<style>
    .container {
        border: 1px black solid;
        display: flex;
        flex-wrap: wrap;
    }

    canvas {
        display: inline-block;
        height: 12px;
        margin-right: 4px;
    }

    span {
        margin: 0.5em;
        white-space: nowrap;
    }
</style>
