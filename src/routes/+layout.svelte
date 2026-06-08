<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<nav>
    <h1>r00ts</h1>
</nav>

{@render children()}

<footer>
    <span>© 2026 AIxDESIGN</span>
    <span>
        Map data: <a href="https://openfreemap.org/" target="_blank">
            OpenFreeMap
        </a>
        <a href="https://www.openmaptiles.org/" target="_blank">
            © OpenMapTiles
        </a>
        Data from
        <a href="https://www.openstreetmap.org/copyright" target="_blank">
            OpenStreetMap
        </a>
        | Aerial images:
        <a href="https://www.mapbox.com/about/maps" target="_blank">
            © Mapbox
        </a>
        <a href="https://www.maxar.com" target="_blank"> © Maxar </a>
    </span>
</footer>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: "Jetbrains Mono", monospace;
    }

    h1 {
        font-size: 42pt;
        padding: 0em 1em;
        margin: 0em;
    }

    nav {
        position: fixed;
        z-index: 100;
    }

    footer {
        position: fixed;
        bottom: 0;
        display: flex;
        width: 100%;
        padding: 0 1em;
        box-sizing: border-box;
        justify-content: space-between;
    }
</style>
