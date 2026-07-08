import { getAllDatacenters, getDatacentersFromIds, getNetworksFromIds } from "$lib/server/database.js";
import { getNetworkIps } from "$lib/server/utils";
import type { Datacenter, Network, Entry } from "$lib/types";

export async function load({ url }) {
    const showDebug: boolean = url.searchParams.get('debug') ? true : false;
    const data64 = url.searchParams.get('data');

    let datacenters: Datacenter[] = [];
    let data: any;
    let entries: Record<string, Entry> = {};
    let pageUrl: string | undefined;
    let networks: Record<number, Network> = {};
    let networksDatacenters: Record<number, number[]> = {};
    let networkIps: Record<number, Entry[]> = {};

    if (data64) {
        try {
            data = JSON.parse(atob(data64));

            if (!data.hasOwnProperty('facility_ids'))
                throw new Error('`data` does not contain facility_ids');

            datacenters = getDatacentersFromIds(data['facility_ids']);

            const network_list = getNetworksFromIds(data['network_ids']);
            network_list.map(net => networks[net.id] = net);
            networksDatacenters = data['network_datacenters'];
            entries = data['entries'];
            pageUrl = data['pageUrl'];

            networkIps = getNetworkIps(entries);
        } catch (err) {
            console.error(err);
        }
    } else {
        datacenters = getAllDatacenters();
    }

    return { datacenters, showDebug, entries, networks, networksDatacenters, pageUrl, networkIps };
}
