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

<footer>© 2026 AIxDESIGN</footer>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
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
    }
</style>
