import { mount } from "svelte";

import Sticker from "./Sticker.svelte";
import maplibregl from "maplibre-gl";
import { showLocation } from "./locationMarker.svelte";

export const stickerMap: Record<string, string> = {
    "bug": "🐛",
    "home": "🏠",
    "butterfly": "🦋",
    "ladybug": "🐞",
    "fox": "🦊",
    "bee": "🐝",
    "frog": "🐸",
    "seed": "🌱",
};

const random = Object.keys(stickerMap)[Math.floor(Math.random() * Object.keys(stickerMap).length)];
console.log(`Sticker: ${random}`);

export let stickerState: {
    avaliable: string,
    placed: boolean,
    locationMarker: maplibregl.Marker | null,
    loading: boolean
} = $state({ avaliable: random, placed: false, locationMarker: null, loading: false });

export function addSticker(map: maplibregl.Map, lngLat: maplibregl.LngLatLike, markerName: string = "bug") {
    let emoji = stickerMap[markerName];

    function onclick() {
        stickerState.placed = false;
        showLocation.value = false;
        emojiMarker.remove();
        stickerState.locationMarker = null;
        stickerState.loading = false;
    }

    const el = document.createElement("div");
    const component = mount(Sticker, {
        target: el,
        props: {
            emoji,
            onclick
        },
    });

    const emojiMarker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(lngLat)
        .addTo(map);

    stickerState.placed = true;
    stickerState.locationMarker = emojiMarker;

    return { marker: emojiMarker, component };
};

