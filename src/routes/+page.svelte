<script lang="ts">
    import Map from "$lib/components/Map/Map.svelte";

    let { data } = $props();
</script>

<Map geoJSON={data} />
