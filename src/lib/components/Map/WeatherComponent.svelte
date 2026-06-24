<script lang="ts">
    import type { Weather } from "$lib/types";
    import "iconify-icon";

    let { weather }: { weather: Weather | null } = $props();

    // weatherCode  Description
    // 0            Clear sky
    // 1, 2, 3      Mainly clear, partly cloudy, and overcast
    // 45, 48       Fog and depositing rime fog
    // 51, 53, 55   Drizzle: Light, moderate, and dense intensity
    // 56, 57       Freezing Drizzle: Light and dense intensity
    // 61, 63, 65   Rain: Slight, moderate and heavy intensity
    // 66, 67       Freezing Rain: Light and heavy intensity
    // 71, 73, 75   Snow fall: Slight, moderate, and heavy intensity
    // 77           Snow grains
    // 80, 81, 82   Rain showers: Slight, moderate, and violent
    // 85, 86       Snow showers slight and heavy
    // 95 *         Thunderstorm: Slight or moderate
    // 96, 99 *     Thunderstorm with slight and heavy hail

    const iconMap: Record<number, string> = {
        0: "fluent:weather-sunny-20-filled",
        1: "fluent:weather-sunny-20-filled",
        2: "fluent:weather-partly-cloudy-day-20-filled",
        3: "fluent:weather-cloudy-20-filled",
        45: "fluent:weather-fog-20-filled",
        48: "fluent:weather-fog-20-filled",
        51: "fluent:weather-drizzle-20-filled",
        53: "fluent:weather-drizzle-20-filled",
        55: "fluent:weather-drizzle-20-filled",
        56: "fluent:weather-drizzle-20-filled",
        57: "fluent:weather-drizzle-20-filled",
        61: "fluent:weather-rain-20-filled",
        63: "fluent:weather-rain-20-filled",
        65: "fluent:weather-rain-20-filled",
        66: "fluent:weather-rain-20-filled",
        67: "fluent:weather-rain-20-filled",
        71: "fluent:weather-snow-20-filled",
        73: "fluent:weather-snow-20-filled",
        75: "fluent:weather-snow-20-filled",
        77: "fluent:weather-snow-20-filled",
        80: "fluent:weather-rain-20-filled",
        81: "fluent:weather-rain-20-filled",
        82: "fluent:weather-rain-20-filled",
        85: "fluent:weather-snow-20-filled",
        86: "fluent:weather-snow-20-filled",
        95: "fluent:weather-thunderstorm-20-filled",
        96: "fluent:weather-thunderstorm-20-filled",
        99: "fluent:weather-thunderstorm-20-filled",
    };

    const iconName: string = $derived.by(() => {
        if (weather == null || !iconMap[weather.weatherCode]) return "";
        else return iconMap[weather.weatherCode];
    });
</script>

<div class="container">
    {#if weather != null && weather.temperature != undefined}
        {#if iconName != ""}
            <iconify-icon
                icon={iconName}
                height="1.2em"
                style="vertical-align: middle;"
                noobserver
            >
            </iconify-icon>
        {/if}
        {weather?.temperature.toFixed(0)}°C
    {/if}
</div>

<style>
    .container {
        font-size: 16pt;
        text-align: left;
        white-space: nowrap;
    }
</style>
