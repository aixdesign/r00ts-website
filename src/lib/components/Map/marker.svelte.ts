import { mount } from "svelte";

import maplibregl from "maplibre-gl";

import type { NoteState, Weather } from "$lib/types";
import Marker from "./Marker.svelte";


export const markerState = $state({
    activeId: null as number | null, lng: 0, lat: 0, properties: {
        name: '',
        links: undefined as string[] | undefined,
        weather: undefined as Weather | undefined
    }
});

export function addMarker(
    map: maplibregl.Map,
    {
        lng,
        lat,
        url,
        id,
        name,
        weather,
        links
    }: {
        lng: number;
        lat: number;
        url?: string;
        id: number;
        name: string;
        links?: string[];
        weather?: Weather;
    },
) {
    const zoomState = $state({ value: map.getZoom() });
    const noteState = $state<NoteState>({
        data: null,
        loading: false
    });

    async function onclick(e?: MouseEvent) {
        e?.stopPropagation();

        const isOpening = markerState.activeId != id;
        markerState.activeId = isOpening ? id : null;
        markerState.lng = lng;
        markerState.lat = lat;
        markerState.properties = { name, links, weather };
    }

    const el = document.createElement("div");
    const component = mount(Marker, {
        target: el,
        props: {
            get zoom() {
                return zoomState.value;
            },
            get open() {
                return markerState.activeId === id;
            },
            get loading() { return noteState.loading },
            url,
            name,
            id,
            weather,
            onclick
        },
    });

    el.classList.add('datacenter-marker');

    const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

    return { marker, component, zoomState };
}
