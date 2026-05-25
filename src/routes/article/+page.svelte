<script lang="ts">
    let { data, form } = $props();
</script>

<p></p>
<p></p>
<ul>
    {#if data.articles.length}
        {#each data.articles as article}
            <li>
                <a href={article.url}>{article.title}</a> - {article.description}
            </li>
        {/each}
    {:else}
        <p>No articles yet!</p>
    {/if}
</ul>

<form method="POST">
    {#if form?.missing && form.missing === "title"}
        <p>Must include title</p>
    {/if}
    {#if form?.missing && form.missing === "url"}
        <p>Must include url</p>
    {/if}

    <label>
        article title: <input
            type="text"
            name="title"
            autocomplete="off"
            value={form?.title ?? ""}
        />
    </label>
    <label>
        article url: <input
            type="text"
            name="url"
            autocomplete="off"
            value={form?.url ?? ""}
        />
    </label>
    <button>Add article</button>
</form>
