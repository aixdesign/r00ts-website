<script lang="ts">
    import type { Entry } from "$lib/types";
    import HoverTip from "../HoverTip.svelte";

    interface Props {
        entryElement: HTMLDivElement | null;
        networkIps: { [key: number]: Entry[] };
        selectedNetId: number | null;
    }

    let { selectedNetId, networkIps, entryElement }: Props = $props();

    let top = $derived(entryElement ? `${entryElement.offsetTop}px` : "-10px");
</script>

<div class="entry-info" style:top>
    <div class="entry-data">
        {#if selectedNetId != null}
            <table>
                <tbody>
                    {#each networkIps[selectedNetId] as entry}
                        <tr>
                            <td><span>({entry.count})</span></td>
                            <td><span>{entry.hostname}</span></td>
                            <td>
                                {#if entry.durationMs}
                                    <span>[{entry.durationMs}ms]</span>
                                {/if}
                            </td>
                            <td class="clue">
                                {#if entry.clue?.city}
                                    <HoverTip
                                        text="This entry has a clue that suggests the city is {entry
                                            .clue.city}"
                                    >
                                        * {entry.clue.city}
                                    </HoverTip>
                                {:else if entry.clue?.code}
                                    <span
                                        class="clue"
                                        title="This entry has a clue that suggests the nearest airport has IATA airport code {entry
                                            .clue.code}"
                                    >
                                        * {entry.clue.code}
                                    </span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>

<style>
    .entry-info {
        background: #edff00;
        position: absolute;
        left: 100%;
        top: 0px;
        width: auto;
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        max-height: 100%;
        overflow-y: scroll;
    }

    .entry-data {
        padding: 0 1em;
        min-width: 20em;
        display: flex;
        flex-direction: column;
    }

    .clue {
        white-space: nowrap;
        user-select: none;
    }
</style>
