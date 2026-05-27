import { mount } from "svelte";

import maplibregl from "maplibre-gl";

import type { NoteState } from "$lib/types";
import Marker from "./Marker.svelte";


export const markerState = $state({ activeId: null as number | null, lng: 0, lat: 0 });

export function addMarker(
    map: maplibregl.Map,
    {
        lng,
        lat,
        url,
        id
    }: {
        lng: number;
        lat: number;
        url: string;
        id: number;
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
            id,
            onclick
        },
    });

    el.classList.add('datacenter-marker');

    const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

    return { marker, component, zoomState };
}
