<script lang="ts">
    import { NoteType } from "$lib/types";
    let { notes } = $props();
</script>

{#each notes as note}
    {#if note.type == NoteType.Article}
        <div class="note article">
            <span>{">"}</span> <a href={note.url}>{note.title}</a>
        </div>
    {:else if note.type == NoteType.Image}
        <div class="note image">
            <img class="image-note" src={note.url} alt={note.title} />
            {#if note.body}
                <span>{note.body}</span>
            {/if}
        </div>
    {:else if note.type == NoteType.Comment}
        <div class="note comment">
            <span>{note.body}</span>
        </div>
    {/if}
{/each}

<style>
    .note {
        margin: 0.5em;
        padding: 0.5em;
    }

    .article {
        background-color: aliceblue;
    }

    .image {
        background-color: seagreen;
    }

    .comment {
        background-color: beige;
    }

    a {
        color: blue;
    }

    a:visited {
        color: blue;
    }
</style>
