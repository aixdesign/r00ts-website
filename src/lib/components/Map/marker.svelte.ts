import { mount } from "svelte";

import maplibregl from "maplibre-gl";

import type { Note } from "$lib/types";
import Marker from "./Marker.svelte";

type NoteState = {
    data: Note[] | null;
    loading: boolean;
};

const markerState = $state({ activeId: null as number | null });

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

        if (isOpening && noteState.data === null && !noteState.loading) {
            noteState.loading = true;
            try {
                const res = await fetch(`/api/note?datacenter_id=${id}`);

                if (!res.ok)
                    throw new Error(res.statusText);
                noteState.data = (await res.json()).notes;
                console.log(noteState.data);

            } catch (err) {
                noteState.data = [];
            } finally {
                noteState.loading = false;
            }
        }

        map.flyTo({ zoom: 15, center: [lng, lat] });

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
            get notes() { return noteState.data },
            url,
            onclick
        },
    });

    el.style.zIndex = "2";

    const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

    return { marker, component, zoomState };
}

export function clearActiveMarker() {
    markerState.activeId = null;
}
