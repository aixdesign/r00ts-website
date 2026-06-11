import { mount } from "svelte";
import { resolve } from "$app/paths";

import maplibregl from "maplibre-gl";

import type { Datacenter, Weather } from "$lib/types";
import Marker from "./Marker.svelte";

const aerialAPI = resolve('/api/aerial/');
const weatherAPI = resolve('/api/weather');

export const markerState = $state({
    datacenter: null as Datacenter | null,
    highlighted: [] as number[],
    preview: [] as number[]
});

export function addMarker(
    map: maplibregl.Map,
    {
        datacenter,
        zoomState,
    }: {
        datacenter: Datacenter;
        zoomState: { value: number }
    },
) {
    const datacenterData = $state(datacenter);
    let weather = $state<{ value: Weather | null }>({ value: null });

    async function onclick(e?: MouseEvent) {
        e?.stopPropagation();

        markerState.datacenter = datacenter;

        if (datacenterData.filename == null && datacenterData.precise) {
            fetch(`${aerialAPI}${datacenter.id}`)
                .then(res => res.json())
                .then(data => {
                    datacenterData.filename = data.filename;
                }).catch(err => {
                    console.error(err);
                })
        }

        if (weather.value == null) {
            fetch(weatherAPI, {
                method: 'POST',
                body: JSON.stringify({
                    id: datacenter.id,
                    lat: datacenter.lat,
                    lon: datacenter.lon
                })
            })
                .then(res => res.json())
                .then((data) => {
                    if (data.message)
                        throw new Error(data.message);

                    weather.value = data;
                })
                .catch(_err => {
                    console.error(`Error fetching weather for ${datacenter.lat} ${datacenter.lon} `);
                })
        }
    }

    const el = document.createElement("div");
    const component = mount(Marker, {
        target: el,
        props: {
            get zoom() {
                return zoomState.value;
            },
            get weather() { return weather.value },
            datacenter: datacenterData,
            onclick
        },
    });

    el.classList.add('datacenter-marker');

    const marker = new maplibregl.Marker({ element: el })
        .setLngLat([datacenter.lon, datacenter.lat])
        .addTo(map);

    return { marker, component, id: datacenterData.id };
}
