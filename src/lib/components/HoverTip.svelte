<script lang="ts">
    import type { FocusEventHandler } from "svelte/elements";

    /**
     * Inline tooltip that follows the mouse.
     *
     * Uses the native Popover API, so the box is promoted to the browser's
     * "top layer": it is never clipped by an ancestor's overflow and never
     * lands behind another element, regardless of z-index or stacking context.
     *
     *   <span>Here is <Tooltip text="Help text here">some</Tooltip> text</span>
     */
    let {
        text,
        children,
        offset = 14, // gap between cursor and box
        margin = 8, // min gap between box and viewport edge
        delay = 0, // ms to wait before showing
    } = $props();

    let box: HTMLDivElement | null = $state(null);
    let open = $state(false);
    let left = $state(0);
    let top = $state(0);
    let timer: NodeJS.Timeout;

    const id = `tt-${Math.random().toString(36).slice(2, 9)}`;

    function place(clientX: number, clientY: number) {
        if (!box) return;

        const { width, height } = box.getBoundingClientRect();

        let x = clientX + offset;
        let y = clientY + offset;

        // flip to the other side of the cursor if it would overflow
        if (x + width + margin > window.innerWidth)
            x = clientX - offset - width;
        if (y + height + margin > window.innerHeight)
            y = clientY - offset - height;

        // ...and clamp, for boxes wider/taller than the space available
        left = Math.max(
            margin,
            Math.min(x, window.innerWidth - width - margin),
        );
        top = Math.max(
            margin,
            Math.min(y, window.innerHeight - height - margin),
        );
    }

    function show(event: { clientX: number; clientY: number }) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            open = true;
            box?.showPopover();
            // showPopover() makes the box measurable, so position it now
            place(event.clientX, event.clientY);
        }, delay);
    }

    function track(event: MouseEvent) {
        if (open) place(event.clientX, event.clientY);
    }

    function hide() {
        clearTimeout(timer);
        open = false;
        box?.hidePopover();
    }

    const showAtElement: FocusEventHandler<HTMLSpanElement> = (event) => {
        const r = event.currentTarget.getBoundingClientRect();
        show({
            clientX: r.left + r.width / 2 - offset,
            clientY: r.bottom - offset,
        });
    };
</script>

<svelte:window on:scroll={hide} on:resize={hide} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
    class="tooltip-anchor"
    aria-describedby={open ? id : undefined}
    tabindex="-1"
    onmouseenter={show}
    onmousemove={track}
    onmouseleave={hide}
    onfocus={showAtElement}
    onblur={hide}
    onkeydown={(e) => e.key === "Escape" && hide()}
>
    {@render children()}
</span>

<div
    bind:this={box}
    {id}
    popover="manual"
    role="tooltip"
    class="tooltip-box"
    style="left: {left}px; top: {top}px;"
>
    {text}
</div>

<style>
    .tooltip-anchor {
        /* stays inline so it doesn't break the flow of a sentence */
        display: inline;
        text-underline-offset: 0.2em;
        user-select: none;
    }

    .tooltip-box {
        /* reset the popover UA defaults (inset: 0 + margin: auto centres it) */
        position: fixed;
        white-space: initial;
        inset: auto;
        margin: 0;
        border: 0;
        overflow: visible;
        pointer-events: none;
        max-width: 20em;
        padding: 0.4em 0.6em;
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .tooltip-box:popover-open {
        display: block;
    }
</style>
