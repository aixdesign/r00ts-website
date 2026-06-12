<script lang="ts">
    import type { Entry, Network } from "$lib/types";

    interface Props {
        entryElement: HTMLDivElement | null;
        networks: { [key: number]: Network };
        networkIps: { [key: number]: Entry[] };
        selectedNetId: number | null;
    }

    let { networks, selectedNetId, networkIps, entryElement }: Props = $props();

    let top = $derived(entryElement ? `${entryElement.offsetTop}px` : "-10px");
</script>

<div class="entry-info" style:top>
    <div class="entry-data">
        {#if selectedNetId != null}
            <span>{networks[selectedNetId]?.organisation_name}</span>
            <table>
                <tbody>
                    {#each networkIps[selectedNetId] as entry}
                        <tr>
                            <td><span>({entry.count})</span></td>
                            <td><span>{entry.hostname}</span></td>
                            <td>
                                <span>[{entry.durationMs}ms]</span>
                            </td>
                            <td>
                                {#if entry.clue?.city}
                                    * {entry.clue.city}
                                {:else if entry.clue?.code}
                                    * {entry.clue.code}
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
</style>
