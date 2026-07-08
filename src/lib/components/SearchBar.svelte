<script lang="ts">
    import { resolve } from "$app/paths";
    import type { Entry } from "$lib/types";
    import { dataState } from "./InfoPanels/data.svelte";

    interface Props {
        hasFocus: boolean;
        fitAll: (animate: boolean) => void;
    }

    let { hasFocus = $bindable(false), fitAll }: Props = $props();

    let query: string = $state("");

    let message: string | null = $state(null);

    let autocompleteTimeout: NodeJS.Timeout | null = $state(null);
    let autocompleteEntries: string[] = $state([]);

    const sessionUrl = resolve("/api/session");

    function onsubmit() {
        const params = new URLSearchParams({ query });
        message = "";

        fetch(`${sessionUrl}?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.entries) {
                    message =
                        "Could not find user submitted results for this query!";
                    return;
                }

                dataState.isSearchResults = true;
                dataState.entries = data.entries;
                dataState.networks = data.networks;
                dataState.pageUrl = data.pageUrl;
                dataState.datacenters = data.datacenters;
                dataState.networkIps = data.networkIps;
                dataState.networksDatacenters = data.networksDatacenters;

                fitAll(true);
            })
            .catch(() => {
                message =
                    "Could not find any user submitted results for this query!";
            });
    }

    function oninput() {
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);

        if (query.length < 2) {
            message = "";
            autocompleteEntries = [];
            return;
        }

        autocompleteTimeout = setTimeout(() => {
            // fetch suggestions
            const params = new URLSearchParams({ autocomplete: query });
            message = "";
            fetch(`${sessionUrl}?${params.toString()}`)
                .then((res) => res.json())
                .then((data) => {
                    autocompleteEntries = data.suggestions;
                })
                .catch((err) => {
                    console.error(err);
                    autocompleteEntries = [];
                });
        }, 500);
    }

    function onkeyup(ev: KeyboardEvent) {
        if (ev.key == "Enter") {
            onsubmit();
        } else if (ev.key == "Escape") {
            query = "";
            autocompleteEntries = [];
            if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
            message = "";
        }
    }

    function completeAutofill(value: string) {
        query = value;
        autocompleteEntries = [];
        onsubmit();
    }
</script>

<div class="wrapper">
    <input
        bind:value={query}
        placeholder="Search user submitted URLs"
        {onkeyup}
        {oninput}
        bind:focused={hasFocus}
    />
    {#if message}
        <div class="error">{message}</div>
    {:else if autocompleteEntries.length}
        <div class="autocomplete-list">
            {#each autocompleteEntries as autocomplete}
                <button
                    class="autocomplete-entry"
                    onclick={() => completeAutofill(autocomplete)}
                >
                    {autocomplete}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .wrapper {
        position: absolute;
        top: 2em;
        left: 50%;
        transform: translateX(-50%);
        z-index: 12;
        width: 26em;
    }

    input {
        font-family: inherit;
        font-size: inherit;
        border: none;
        width: 100%;
        box-sizing: border-box;
        text-align: center;
        padding: 0.5em 1em;
    }

    .error,
    .autocomplete-list {
        background-color: white;
        padding: 1em;
        width: 100%;
        box-sizing: border-box;
    }

    .autocomplete-list {
        display: flex;
        flex-direction: column;
    }

    .autocomplete-entry {
        text-align: left;
        cursor: pointer;
        border: none;
        font-family: inherit;
        background: none;
    }

    .autocomplete-entry:hover {
        background: #e7e7e7;
    }

    @media (width < 720px) {
        .wrapper {
            top: 6em;
            width: 80%;
            max-width: 20em;
        }
    }
</style>
