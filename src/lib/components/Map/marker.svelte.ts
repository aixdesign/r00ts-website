import type { Datacenter, Network } from "$lib/types";

let datacenter: Datacenter | null = $state(null);
let networks: Network[] = $state.raw([]);
let highlighted: number[] = $state.raw([]);
let preview: number[] = $state.raw([]);
let largeMarker: boolean = $state(false);

export const markerState = {
    get datacenter(): Datacenter | null { return datacenter },
    set datacenter(v: Datacenter | null) { datacenter = v },
    get networks(): Network[] { return networks },
    set networks(v: Network[]) { networks = v },
    get highlighted(): number[] { return highlighted },
    set highlighted(v: number[]) { highlighted = v },
    get preview(): number[] { return preview },
    set preview(v: number[]) { preview = v },
    get largeMarker(): boolean { return largeMarker },
    set largeMarker(v: boolean) { largeMarker = v },
};

export function selectDatacenter(map: maplibregl.Map, datacenter: Datacenter, animate: boolean = true) {
    markerState.datacenter = datacenter;

    map.flyTo({
        animate,
        zoom: 16,
        center: [markerState.datacenter.lon, markerState.datacenter.lat],
        duration: 1000,
    });
}
