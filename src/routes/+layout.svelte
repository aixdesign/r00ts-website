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

<style>
    @font-face {
        font-family: "GT Pressura Mono";
        src:
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Bold.woff2")
                format("woff2"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Bold.woff") format("woff"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Bold.ttf")
                format("truetype");
        font-weight: bold;
        font-style: normal;
    }

    @font-face {
        font-family: "GT Pressura Mono";
        src:
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Light.woff2")
                format("woff2"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Light.woff") format("woff"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Light.ttf")
                format("truetype");
        font-weight: lighter;
        font-style: normal;
    }

    @font-face {
        font-family: "GT Pressura Mono";
        src:
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Regular.woff2")
                format("woff2"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Regular.woff")
                format("woff"),
            url("/fonts/GT-Pressura/GT-Pressura-Mono-Regular.ttf")
                format("truetype");
        font-weight: normal;
        font-style: normal;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        font-family: "GT Pressura Mono", monospace;
        font-variant-numeric: slashed-zero;
    }

    h1 {
        font-weight: lighter;
        font-size: 64pt;
        padding: 0 0.4em;
        margin: 0em;
        user-select: none;
    }

    nav {
        position: fixed;
        z-index: 100;
        pointer-events: none;
    }
</style>
