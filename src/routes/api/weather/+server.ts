import { json, error } from '@sveltejs/kit';

import type { Weather } from '$lib/types.js';

import { fetchWeatherApi } from 'openmeteo';

const weatherCache: { [key: number]: Weather } = {};

export async function POST({ request }) {
    const { id, lat, lon } = await request.json();

    const now = Date.now() / 1000;
    if (!weatherCache[id] || weatherCache[id].timestamp > now + 60 * 60) {

        const params = {
            latitude: lat,
            longitude: lon,
            current: 'weather_code,temperature_2m',
        };

        const fetchOptions = {
            headers: {
                'User-Agent': "DatacenterMap/1.0"
            }
        };

        const weatherURL = "https://api.open-meteo.com/v1/forecast";

        // console.log("Fetching weather...");
        // console.log(`${weatherURL}?${new URLSearchParams(params).toString()}`);

        try {
            const response = await fetchWeatherApi(weatherURL, params, 3, 0.2, 2, fetchOptions);

            const current = response[0].current();
            const weatherCode = current?.variables(0)!.value();
            const temperature = current?.variables(1)!.value();

            if (temperature && weatherCode != undefined)
                weatherCache[id] = {
                    timestamp: now,
                    temperature: temperature,
                    weatherCode
                };

            return json({
                time: now,
                weatherCode,
                temperature
            });

        } catch (err) {
            console.error('Error fetching weather:');
            console.error(err);

            return error(500);
        }

    } else {
        //console.log(`weatherCache hit for id ${id}`);

        return json(weatherCache[id]);
    }

}
