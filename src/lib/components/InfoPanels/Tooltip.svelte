<script lang="ts">
    import { onMount } from "svelte";
    import { getTooltipState } from "./tooltip.svelte";

    interface Props {
        children: any;
        background?: string;
    }
    let { children, background }: Props = $props();

    let id = Symbol();
    const tooltipState = getTooltipState();

    let element: HTMLElement;

    let left: string = $state("50vh");
    let bottom: string = $state("50vw");

    let open = $derived.by(() => {
        return tooltipState.openTooltips.has(id);
    });

    onMount(() => {
        const bounds = element.getBoundingClientRect();
        left = bounds.left + bounds.width + "px";
        bottom = window.innerHeight - bounds.bottom + "px";
    });
</script>

<button
    onclick={() => {
        tooltipState.toggle(id);
    }}
    bind:this={element}
    style:background
>
    (?)
</button>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="tooltip"
        style:background
        style:left
        style:bottom
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
        max-width: 20em;
        background: #e7e7e7;
        padding: 1em;
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
