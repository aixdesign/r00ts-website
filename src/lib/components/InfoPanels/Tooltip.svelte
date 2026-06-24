<script lang="ts">
    import { getTooltipState } from "./tooltip.svelte";

    interface Props {
        children: any;
        background?: string;
    }
    let { children, background }: Props = $props();

    let id = Symbol();
    const tooltipState = getTooltipState();

    let element: HTMLElement;

    let open = $derived.by(() => {
        return tooltipState.openTooltips.has(id);
    });
</script>

<div class="container">
    <button
        onclick={() => {
            tooltipState.toggle(id);
        }}
        bind:this={element}
        style:background
    >
        ?
    </button>
    {#if open}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="tooltip"
            style:background
            class:above={tooltipState.active == id}
            onclick={() => {
                tooltipState.active = id;
            }}
        >
            {@render children?.()}
            <button class="close-btn" onclick={() => tooltipState.close(id)}>
                X
            </button>
        </div>
    {/if}
</div>

<style>
    .container {
        display: inline-block;
        position: relative;
    }

    button {
        border: none;
        font-size: inherit;
        font-family: inherit;
        padding: 0;
        cursor: pointer;
        aspect-ratio: 1;
        height: 1.5em;
    }

    .tooltip {
        position: absolute;
        left: 120%;
        bottom: 50%;
        z-index: 12;
        min-width: 20em;
        background: #e7e7e7;
        padding: 1em;
        font-size: 12pt;
    }

    .above {
        z-index: 13;
    }

    .close-btn {
        position: absolute;
        top: 0;
        right: 0;
        padding: 0.5em 1em;
        background: inherit;
    }
</style>
