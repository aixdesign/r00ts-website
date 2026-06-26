import { mount } from "svelte";

import Sticker from "./Sticker.svelte";
import maplibregl from "maplibre-gl";

export const stickerMap: Record<string, string> = {
    "bug": "🐛",
    "home": "🏠",
    "butterfly": "🦋",
    "robot": "🤖",
    "ladybug": "🐞"
};

const random = Object.keys(stickerMap)[Math.floor(Math.random() * Object.keys(stickerMap).length)];
console.log(`Sticker: ${random}`);

export let stickerState: {
    avaliable: string,
    placed: boolean,
    locationMarker: maplibregl.Marker | null
} = $state({ avaliable: random, placed: false, locationMarker: null });

export function addSticker(map: maplibregl.Map, lngLat: maplibregl.LngLatLike, markerName: string = "bug") {
    let emoji = stickerMap[markerName];

    function onclick() {
        stickerState.placed = false;
        emojiMarker.remove();
        stickerState.locationMarker = null;
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

    return { marker: emojiMarker, component };
};

