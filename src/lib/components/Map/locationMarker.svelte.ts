import maplibregl from "maplibre-gl";
import { mount, unmount } from "svelte";
import LocationMarker from "./LocationMarker.svelte";

let watchId: number;
let locationMarker: maplibregl.Marker | null = null;
let component: { $set?: any, $get?: any };

export let showLocation = $state({ value: false });

let follow = true;

function success(map: maplibregl.Map, position: GeolocationPosition) {
    // Success
    if (!locationMarker) {
        const locationMarkerEl = document.createElement("div");
        locationMarkerEl.style.zIndex = "5";
        component = mount(LocationMarker, { target: locationMarkerEl });

        locationMarker = new maplibregl.Marker({
            element: locationMarkerEl,
            draggable: true,
        })
            .setLngLat([
                position.coords.longitude,
                position.coords.latitude,
            ])
            .addTo(map);

        locationMarker.once('dragstart', () => {
            // stop updating location
            window.navigator.geolocation.clearWatch(watchId);
        });

        follow = true;

        map.once('dragstart', () => {
            follow = false;
        });

        map.flyTo({
            center: locationMarker.getLngLat(),
            zoom: 12,
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
                zoom: 12,
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
        watchId = window.navigator.geolocation.watchPosition(
            (position) => success(map, position),
            error,
            { enableHighAccuracy: true },
        );
    } else {
        locationMarker?.remove();
        locationMarker = null;

        if (watchId != undefined)
            window.navigator.geolocation.clearWatch(watchId);
    }

    showLocation.value = !showLocation.value;
}

export function destroyLocationMarker() {

    if (watchId != undefined)
        window.navigator.geolocation.clearWatch(watchId);

    if (component)
        unmount(component);
}
