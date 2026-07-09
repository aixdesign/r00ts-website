import maplibregl from "maplibre-gl";
import { unmount } from "svelte";
import { addSticker, stickerState } from "./sticker.svelte";

let watchId: number;
let component: { $set?: any, $get?: any };

export let showLocation = $state({ value: false });

function success(map: maplibregl.Map, position: GeolocationPosition) {
    stickerState.loading = false;
    if (!stickerState.locationMarker) {
        const sticker = addSticker(map, [
            position.coords.longitude,
            position.coords.latitude,
        ], stickerState.avaliable);

        stickerState.locationMarker = sticker.marker;
        component = sticker.component;
        stickerState.locationMarker.once('dragstart', () => {
            stopUpdatingLocation();
        });

    } else {
        // update location marker
        stickerState.locationMarker.setLngLat([
            position.coords.longitude,
            position.coords.latitude,
        ]);
    }
}

function error(error: GeolocationPositionError) {
    showLocation.value = false;
    stickerState.loading = false;
    console.log(
        `Geolocation Error: ${error.code}: ${error.message}`,
    );
}

export function getUserLocation(map: maplibregl.Map) {
    if (!showLocation.value) {
        showLocation.value = true;
        watchId = window.navigator.geolocation.watchPosition(
            (position) => success(map, position),
            error,
            { enableHighAccuracy: true },
        );
        stickerState.loading = true;
    } else {
        stickerState.locationMarker?.remove();
        stickerState.locationMarker = null;
        stickerState.loading = false;

        stopUpdatingLocation();
    }

    return showLocation.value;
}

export function stopUpdatingLocation() {
    // Keeps marker in place
    if (watchId != undefined)
        window.navigator.geolocation.clearWatch(watchId);

    showLocation.value = false;
    stickerState.loading = false;
}

export function destroyLocationMarker() {
    if (watchId != undefined)
        window.navigator.geolocation.clearWatch(watchId);

    if (component)
        unmount(component);
}
