<script lang="ts">
    interface Props {
        children: any;
        onclick: (ev: MouseEvent) => void;
        highlight?: boolean;
    }

    let { children, onclick, highlight }: Props = $props();
</script>

<button class:highlight {onclick}>
    {@render children?.()}
</button>

<style>
    button {
        border: 2px solid black;
        background: white;
        padding: 0.2em 0.4em;
        cursor: pointer;
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        font-size: 16pt;
        margin: 0.2em;
    }

    button:hover {
        background: #e7e7e7;
    }

    .highlight {
        color: #ff5f1f;
    }
</style>
