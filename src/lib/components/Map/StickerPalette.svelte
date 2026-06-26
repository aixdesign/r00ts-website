<script lang="ts">
    import { stickerMap, stickerState } from "./sticker.svelte";

    function ondragstart(e: DragEventInit, name: string | null) {
        if (name == null) return;

        if (e.dataTransfer) {
            e.dataTransfer.clearData();
            e.dataTransfer.setData("text/plain", name);
        }
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->

<div class="palette" class:hidden={stickerState.placed}>
    <div
        class="sticker"
        ondragstart={(e) => ondragstart(e, stickerState.avaliable)}
        draggable="true"
    >
        {stickerMap[stickerState.avaliable]}
    </div>
</div>

<style>
    .palette {
        display: inline-flex;
        flex-direction: column;
    }

    .hidden {
        display: none;
    }

    .sticker {
        text-align: center;
        cursor: grab;
        user-select: none;
    }
</style>
