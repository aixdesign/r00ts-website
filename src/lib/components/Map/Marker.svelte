<script lang="ts">
    let {
        url = "",
        zoom = 13,
        open = false,
        onclick,
    }: {
        id: number;
        url: string;
        zoom: number;
        open: boolean;
        loading: boolean;
        onclick: (e?: MouseEvent) => void;
    } = $props();

    let zoomed = $derived(zoom < 13);
</script>

<div class="marker-root" class:front={open}>
    <div
        class="marker"
        class:marker-open={open}
        class:marker-small={zoomed}
        {onclick}
        role="button"
        tabindex="0"
        aria-label="Datacenter"
        onkeydown={(e) => e.key === "Enter" && onclick?.()}
    >
        <img class="aerial" src={url} alt="Aerial view" />
    </div>
</div>

<style>
    .marker-root {
        position: relative;
        pointer-events: all;
    }

    .marker {
        height: 200px;
        width: 200px;
        transition-property: width, height !important;
        transition-duration: 1s !important;
        position: relative;
        cursor: pointer;
        z-index: 2;
    }

    .marker-open,
    .marker:hover {
        transform: scale(1.1);
    }

    .aerial {
        background-size: cover;
        height: 100%;
        border: 0.8em solid white;
    }

    .marker-small {
        width: 50px;
        height: 50px;
    }

    :global(.datacenter-marker) {
        z-index: 2;
        pointer-events: all;
    }

    :global(.datacenter-marker:has(.front)) {
        z-index: 10;
    }
</style>
