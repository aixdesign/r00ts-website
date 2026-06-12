import { getAllDatacenters, getDatacentersFromIds, getNetworksFromIds } from "$lib/server/database.js";
import type { Datacenter, Network } from "$lib/types";

export async function load({ url }) {
    const showDebug: boolean = url.searchParams.get('debug') ? true : false;
    const data64 = url.searchParams.get('data');

    let datacenters: Datacenter[] = [];
    let data;
    let ipData = null;
    let pageUrl: string | undefined;
    let networks: { [key: number]: Network } = {};
    let networksDatacenters = null;

    if (data64) {
        try {
            data = JSON.parse(atob(data64));

            if (!data.hasOwnProperty('facility_ids'))
                throw new Error('`data` does not contain facility_ids');

            datacenters = getDatacentersFromIds(data['facility_ids']);

            const network_list = getNetworksFromIds(data['network_ids']);
            network_list.map(net => networks[net.id] = net);
            networksDatacenters = data['network_datacenters'];
            ipData = data['entries'];
            pageUrl = data['pageUrl'];

        } catch (err) {
            console.error(err);
        }
    } else {
        datacenters = getAllDatacenters();
    }

    return { datacenters, showDebug, ipData, networks, networksDatacenters, pageUrl };
}
