import type { Network, Entry } from '$lib/types';

let pageUrl: string = $state('');
let networks: { [key: number]: Network } = $state.raw({});
let networksDatacenters: { [key: number]: number[] } = $state.raw({});
let entries: { [key: string]: Entry } = $state.raw({});
let networkIps: { [key: number]: Entry[] } = $state.raw({});

export const dataState = {
    get networks() { return networks; },
    set networks(v) { networks = v },
    get networksDatacenters() { return networksDatacenters },
    set networksDatacenters(v) { networksDatacenters = v },
    get entries() { return entries },
    set entries(v) { entries = v },
    get networkIps() { return networkIps },
    set networkIps(v) { networkIps = v },
    get pageUrl() { return pageUrl },
    set pageUrl(v: string) { pageUrl = v }
}

