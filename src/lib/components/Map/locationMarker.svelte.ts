import maplibregl from "maplibre-gl";
import { unmount } from "svelte";
import { addSticker, stickerState } from "./sticker.svelte";

let watchId: number;
let locationMarker: maplibregl.Marker | null = null;
let component: { $set?: any, $get?: any };

export let showLocation = $state({ value: false });

let follow = true;

function success(map: maplibregl.Map, position: GeolocationPosition) {
    if (!locationMarker) {
        if (!stickerState.locationMarker) {
            const sticker = addSticker(map, [
                position.coords.longitude,
                position.coords.latitude,
            ], stickerState.avaliable);

            locationMarker = sticker.marker;
            component = sticker.component;
        } else {
            locationMarker = stickerState.locationMarker;
        }

        locationMarker.once('dragstart', () => {
            stopUpdatingLocation();
        });

        follow = true;

        map.once('dragstart', () => {
            follow = false;
        });

        map.once('zoomstart', () => {
            follow = false;
        });

        map.flyTo({
            center: locationMarker.getLngLat(),
        });
    } else {
        // update location marker
        locationMarker.setLngLat([
            position.coords.longitude,
            position.coords.latitude,
        ]);

        if (follow)
            map.jumpTo({
                center: locationMarker.getLngLat(),
            });
    }
}

function error(error: GeolocationPositionError) {
    showLocation.value = false;
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
    } else {
        locationMarker?.remove();
        locationMarker = null;

        stickerState.locationMarker = null;
        stopUpdatingLocation();
    }

    return showLocation.value;
}

export function stopUpdatingLocation() {
    // Keeps marker in place
    if (watchId != undefined)
        window.navigator.geolocation.clearWatch(watchId);

    showLocation.value = false;

}

export function destroyLocationMarker() {

    if (watchId != undefined)
        window.navigator.geolocation.clearWatch(watchId);

    if (component)
        unmount(component);
}
