import type { Network, Entry } from '$lib/types';

export const dataState: {
    networks?: { [key: number]: Network },
    networksDatacenters?: any,
    entries: { [key: string]: Entry };
} = $state({
    networks: {},
    networksDatacenters: {},
    entries: {}
});

