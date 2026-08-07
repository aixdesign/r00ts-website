<script lang="ts">
    import { resolve } from "$app/paths";
    import { dataState } from "./InfoPanels/data.svelte";

    interface Props {
        hasFocus: boolean;
        fitAll: (animate: boolean) => void;
    }

    let { hasFocus = $bindable(false), fitAll }: Props = $props();

    let query: string = $state("");

    let showHelp = $state(false);
    let noResults = $state(false);

    let autocompleteTimeout: NodeJS.Timeout | null = $state(null);
    let autocompleteEntries: string[] = $state([]);

    const sessionUrl = resolve("/api/session");

    function onsubmit() {
        const params = new URLSearchParams({ query });
        noResults = false;

        fetch(`${sessionUrl}?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.entries) {
                    noResults = true;
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
                noResults = true;
            });
    }

    function oninput() {
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);

        if (query.length < 2) {
            noResults = false;
            autocompleteEntries = [];
            return;
        }

        autocompleteTimeout = setTimeout(() => {
            // fetch suggestions
            const params = new URLSearchParams({ autocomplete: query });
            fetch(`${sessionUrl}?${params.toString()}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data.suggestions?.length) {
                        autocompleteEntries = [];
                        noResults = true;
                        return;
                    }
                    autocompleteEntries = data.suggestions;
                })
                .catch((err) => {
                    console.error(err);
                    autocompleteEntries = [];
                    noResults = true;
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
            noResults = false;
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
        onfocusin={() => {
            if (!autocompleteEntries.length) showHelp = true;
        }}
        onfocusout={() => (showHelp = false)}
        bind:focused={hasFocus}
    />
    {#if noResults}
        <div class="message">
            No one has traced this website yet, so we can't tell you anything
            from here. Want to know where it's rooted? <a
                href="https://github.com/aixdesign/r00ts-extension"
                target="_blank">Install the extension</a
            > and trace it yourself!
        </div>
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
    {:else if showHelp}
        <div class="message">
            Search what others have traced and submitted to the community
            database.
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

    .message,
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
