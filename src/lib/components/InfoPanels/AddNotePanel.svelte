<script lang="ts">
    import { NoteType } from "$lib/types";

    let { id, newNoteAdded } = $props();
    let adding = $state(false);
    let showAddNoteForm = $derived(id != null && adding);

    let errorMessage = $state("");
    let canSubmit = $derived.by(() => {
        if (noteType === "article") return title.length > 0 && url.length > 0;
        else if (noteType === "comment") return body.length > 0;
        else if (noteType === "image") return url.length > 0;
        return false;
    });

    function toggleForm(e: MouseEvent) {
        e.preventDefault();
        adding = !adding;

        if (!adding) {
            noteType = "article";
            title = "";
            url = "";
            body = "";
        }
    }

    let submitBtn: HTMLButtonElement | undefined = $state();

    async function submitNote() {
        console.log("submitNote", id);

        if (id == null) return;

        if (submitBtn) submitBtn.disabled = true;

        const type: number =
            noteType == "article"
                ? NoteType.Article
                : noteType === "comment"
                  ? NoteType.Comment
                  : NoteType.Image;

        try {
            const res = await fetch("/api/note", {
                method: "POST",
                body: JSON.stringify({
                    datacenter_id: id,
                    title,
                    url,
                    body,
                    type,
                }),
            });

            const result = await res.json();
            if (result.success) {
                newNoteAdded({
                    title,
                    url,
                    body,
                    type,
                    datacenter_id: id,
                    id: 1000,
                });

                adding = false;
            } else {
                errorMessage = result.message;
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    let noteType = $state("article");
    let title = $state("");
    let url = $state("");
    let body = $state("");
</script>

<div class="add-note-form" class:open={showAddNoteForm}>
    <button
        class="add-note-btn"
        onclick={toggleForm}
        aria-label={adding ? "Close form" : "Open form"}
    >
        <span class="icon" class:rotated={adding}>+</span>
    </button>
    {#if adding}
        <div id="form-panel">
            <span class="error">{errorMessage}</span>
            <select bind:value={noteType}>
                <option value="article">Article</option>
                <option value="comment">Comment</option>
                <option value="image">Image</option>
            </select>
            {#if noteType === "article"}
                <label>
                    Title
                    <input bind:value={title} type="text" />
                </label>
            {/if}
            {#if noteType === "article" || noteType === "image"}
                <label>
                    URL
                    <input bind:value={url} type="text" />
                </label>
            {/if}
            <label>
                Comment
                <textarea bind:value={body} rows="2"></textarea>
            </label>
            <button
                bind:this={submitBtn}
                onclick={submitNote}
                disabled={!canSubmit}
            >
                Submit
            </button>
        </div>
    {/if}
</div>

<style>
    .add-note-form {
        position: absolute;
        left: 0;
        bottom: 0;
        background-color: lavender;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0;
        z-index: 3;
        pointer-events: all;
    }

    .open {
        width: 100%;
    }

    .add-note-btn {
        top: 0;
        left: 0;
        background: none;
        border: none;
        cursor: pointer;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition:
            background 0.2s,
            transform 0.2s;
    }

    .icon {
        font-size: 1.4rem;
        line-height: 1;
        display: block;
        transition: transform 0.3s ease-in-out;
        margin-top: -1px;
    }

    .icon.rotated {
        transform: rotate(45deg);
    }

    .error {
        color: red;
    }

    #form-panel {
        margin: 10px;
        width: 300px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
</style>
