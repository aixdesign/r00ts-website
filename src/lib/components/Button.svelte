<script lang="ts">
    interface Props {
        children: any;
        onclick: (ev: MouseEvent) => void;
        element: HTMLButtonElement | undefined;
        highlight?: boolean;
    }

    let {
        children,
        onclick,
        highlight,
        element = $bindable(),
        ...props
    }: Props = $props();
</script>

<button bind:this={element} class:highlight {onclick} {...props}>
    {@render children?.()}
</button>

<style>
    button {
        border: 2px solid black;
        background: white;
        padding: 0.2em 0.4em;
        cursor: pointer;
        font-family: "GT Pressura Mono", monospace;
        font-weight: lighter;
        font-size: 16pt;
        margin: 0.2em;
        width: fit-content;
    }

    button:hover {
        background: #e7e7e7;
    }

    .highlight {
        color: #ff5f1f;
    }
</style>
