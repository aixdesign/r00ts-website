<script lang="ts">
    interface Props {
        emoji: string;
        onclick: (e: MouseEvent) => void;
    }

    let { emoji, onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="emoji" {onclick}>{emoji}</div>

<style>
    .emoji {
        --border-colour: #fff;
        font-size: 28pt;
        text-shadow:
            -4px -4px 0 var(--border-colour),
            -4px 4px 0 var(--border-colour),
            4px -4px 0 var(--border-colour),
            4px 4px 0 var(--border-colour),
            0px 4px 0 var(--border-colour),
            0px -4px 0 var(--border-colour),
            4px 0px 0 var(--border-colour),
            -4px 0px 0 var(--border-colour),
            2px 4px 0 var(--border-colour),
            2px -4px 0 var(--border-colour),
            4px 2px 0 var(--border-colour),
            -4px 2px 0 var(--border-colour),
            -2px 4px 0 var(--border-colour),
            -2px -4px 0 var(--border-colour),
            4px -2px 0 var(--border-colour),
            -4px -2px 0 var(--border-colour);
    }
</style>
