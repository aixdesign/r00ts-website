<script lang="ts">
    import { resolve } from "$app/paths";
    import { dataState } from "./InfoPanels/data.svelte";

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
                console.log(data);
                if (!data.entries) {
                    message =
                        "Could not find user submitted results for this query!";
                    return;
                }

                dataState.entries = data.entries;
                dataState.networks = data.networks;
                dataState.pageUrl = data.pageUrl;
            })
            .catch(() => {
                message =
                    "Could not find any user submitted results for this query!";
            });
    }

    function oninput() {
        //console.log(`oninput ${query}`);
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);

        if (!query.length) {
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

    function completeAutofill(value: string) {
        query = value;
        autocompleteEntries = [];
        onsubmit();
    }
</script>

<div class="wrapper">
    <input
        bind:value={query}
        placeholder="Search user submitted URLs, or any IP address"
        onkeyup={(ev) => {
            if (ev.key == "Enter") onsubmit();
        }}
        {oninput}
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
        padding: 0.2em;
        border: none;
        width: 100%;
        box-sizing: border-box;
        text-align: center;
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
</style>
