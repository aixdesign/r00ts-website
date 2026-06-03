import { getDatacentersFromIds } from "$lib/server/database.js";
import type { Datacenter, Weather } from "$lib/types";

const weatherCache: { [key: number]: Weather } = {};

export async function load({ url }) {
    const ids = url.searchParams.get('ids');

    let datacenters: Datacenter[] = [];
    if (ids) {
        const ids_obj = JSON.parse(ids);
        if (Array.isArray(ids_obj))
            datacenters = getDatacentersFromIds(ids_obj);
    }

    // TODO: load from database!
    const datacentersGeoJson = {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {
                        'description': 'Digital Realty Amsterdam AMS17',
                        'url': 'img1.png',
                        'name': 'Digital Realty Amsterdam AMS17',
                        'links': ['https://www.digitalrealty.com/data-centers/emea/amsterdam/ams17'],
                        'id': 1,
                        'weather': { 'temp': null as number | null, 'weatherCode': 0 }
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [4.9508, 52.3571]
                    }
                },
                {
                    'type': 'Feature',
                    'properties': {
                        'description': '',
                        'url': 'img2.png',
                        'id': 2,
                        'name': 'Equinix Amsterdam AM4',
                        'links': ['https://www.equinix.com/data-centers/europe-colocation/netherlands-colocation/amsterdam-data-centers/am4']
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [4.9614, 52.3546]
                    }
                }
            ]
        }
    }

    // Get weather info
    // const now = Date.now() / 1000;
    // for (const { properties, geometry } of datacentersGeoJson.data.features) {
    //     const { id } = properties;
    //     if (!weatherCache[id] || weatherCache[id].timestamp > now + 60 * 60) {
    //
    //         const [lng, lat] = geometry.coordinates;
    //
    //         const params = new URLSearchParams({
    //             latitude: String(lat),
    //             longitude: String(lng),
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
    //             properties.weather = weather;
    //         } catch (err) {
    //             console.error(err)
    //             continue;
    //         }
    //
    //
    //
    //     } else {
    //         properties.weather = weatherCache[id];
    //     }
    // }

    return { datacentersGeoJson, datacenters };
}
