<script lang="ts">
    import { getTooltipState } from "./tooltip.svelte";

    interface Props {
        children: any;
        colour?: string;
    }
    let { children, colour }: Props = $props();

    let id = Symbol();
    const tooltipState = getTooltipState();
</script>

<button
    onclick={() => {
        tooltipState.toggle(id);
    }}
>
    (?)
</button>

{#if tooltipState.active === id}
    <div class="tooltip" style:background={colour}>
        {@render children?.()}
        <button class="close-btn" onclick={() => tooltipState.close()}>x</button
        >
    </div>
{/if}

<style>
    button {
        border: none;
        font-weight: 600;
        font-size: inherit;
        font-family: inherit;
        padding: 0;
        cursor: pointer;
    }

    .tooltip {
        position: fixed;
        z-index: 12;
        top: 50vh;
        left: 50vw;
        max-width: 20em;
        background: #e7e7e7;
        padding: 1em;
        transform: translate(-50%, -50%);
    }

    .close-btn {
        position: absolute;
        top: 0;
        right: 0;
        padding: 0.5em 1em;
        background: inherit;
    }
</style>
