<script lang="ts">
    import { NoteType, type Note } from "$lib/types";

    let {
        url = "",
        zoom = 13,
        open = false,
        loading = false,
        notes = [],
        onclick,
    }: {
        url: string;
        zoom: number;
        open: boolean;
        loading: boolean;
        notes: Note[] | null;
        onclick: (e?: MouseEvent) => void;
    } = $props();

    let zoomed = $derived(zoom < 13);
    let noteEntries = $derived(notes != null ? notes : []);

    function positionNote(index: number, total: number) {
        const angle = (2 * Math.PI * index) / total - Math.PI / 2;
        const radius = 90;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    }
</script>

<div class="marker-root">
    {#if open}
        {#if loading}
            <span class="spinner"></span>
        {/if}
        {#each noteEntries as note, i}
            {@const pos = positionNote(i, noteEntries.length)}
            <div class="note" style="transform: translate({pos.x}, {pos.y})">
                {#if note.type == NoteType.Article}
                    <a href={note.url}>{note.title}</a>
                {:else if note.type == NoteType.Image}
                    <img class="image-note" src={note.url} alt={note.title} />
                {:else if note.type == NoteType.Comment}
                    <span>{note.body}</span>
                {/if}
            </div>
        {/each}
    {/if}
    <div
        class="marker {zoomed ? 'marker-small' : ''}"
        {onclick}
        role="button"
        tabindex="0"
        aria-label="Datacenter"
        onkeydown={(e) => e.key === "Enter" && onclick?.()}
    >
        <div class="aerial" style="background-image: url({url})"></div>
    </div>
</div>

<style>
    .marker {
        height: 200px;
        width: 200px;
        transition-property: width, height !important;
        transition-duration: 1s !important;
        padding: 0.8em;
        position: relative;
        cursor: pointer;
        z-index: 2;
    }

    .marker:hover {
        transform: scale(1.1);
    }

    .aerial {
        background-size: cover;
        height: 100%;
    }

    .marker-small {
        width: 50px;
        height: 50px;
    }

    .note {
        position: absolute;
        background: white;
        padding: 6px 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        pointer-events: none;
        white-space: nowrap;
        z-index: 3;
    }

    .spinner {
        display: block;
        width: 16px;
        height: 16px;
        border: 2px solid #ddd;
        border-top-color: #457b9d;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
