import { mount } from "svelte";

import maplibregl from "maplibre-gl";

import type { Datacenter, Weather } from "$lib/types";
import Marker from "./Marker.svelte";


export const markerState = $state({
    datacenter: null as Datacenter | null,
    highlighted: [] as number[],
    preview: [] as number[]
});

export function addMarker(
    map: maplibregl.Map,
    {
        datacenter,
        weather,
        zoomState,
    }: {
        datacenter: Datacenter;
        weather?: Weather;
        zoomState: { value: number }
    },
) {
    const datacenterData = $state(datacenter);

    async function onclick(e?: MouseEvent) {
        e?.stopPropagation();

        markerState.datacenter = datacenter;

        if (datacenterData.filename == null && datacenterData.precise) {
            fetch(`${import.meta.env.BASE_URL}/api/aerial/${datacenter.id}`)
                .then(res => res.json())
                .then(data => {
                    datacenterData.filename = data.filename;
                }).catch(err => {
                    console.error(err);
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
            datacenter: datacenterData,
            weather,
            onclick
        },
    });

    el.classList.add('datacenter-marker');

    const marker = new maplibregl.Marker({ element: el })
        .setLngLat([datacenter.lon, datacenter.lat])
        .addTo(map);

    return { marker, component, id: datacenterData.id };
}
