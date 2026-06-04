import { getAllDatacenters, getDatacentersFromIds } from "$lib/server/database.js";
import type { Datacenter, Weather } from "$lib/types";

const weatherCache: { [key: number]: Weather } = {};

export async function load({ url }) {
    const ids = url.searchParams.get('ids');
    const showDebug = url.searchParams.get('debug') ? true : false;

    let datacenters: Datacenter[] = [];
    if (ids) {
        const ids_obj = JSON.parse(ids);
        if (Array.isArray(ids_obj)) {
            datacenters = getDatacentersFromIds(ids_obj);
        }
    } else {
        datacenters = getAllDatacenters();
    }

    const weatherResults: { [key: number]: Weather } = {};

    // Get weather info
    // const now = Date.now() / 1000;
    // for (const dc of datacenters) {
    //     const { id, lon, lat } = dc;
    //     if (!weatherCache[id] || weatherCache[id].timestamp > now + 60 * 60) {
    //
    //         const params = new URLSearchParams({
    //             latitude: String(lat),
    //             longitude: String(lon),
    //             current: 'weather_code,temperature_2m',
    //             forcast_days: '1'
    //         });
    //
    //         const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    //         console.log(url);
    //
    //         try {
    //             const res = await fetch(url);
    //             const data = await res.json();
    //             const weather: Weather = {
    //                 timestamp: now,
    //                 temp: data.current.temperature_2m,
    //                 weatherCode: data.current.weather_code
    //             }
    //
    //             weatherCache[id] = weather;
    //             weatherResults[id] = weather;
    //         } catch (err) {
    //             console.error(err)
    //             continue;
    //         }
    //
    //
    //
    //     } else {
    //         weatherResults[id] = weatherCache[id];
    //     }
    // }

    return { datacenters, weatherResults, showDebug };
}
