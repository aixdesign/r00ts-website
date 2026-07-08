
import { json, error } from '@sveltejs/kit';

import * as database from '$lib/server/database.js';
import { isIPv4 } from '$lib/ip_utils.js';
import type { Entry } from '$lib/types.js';
import { getHostname, getNetworkIps } from '$lib/server/utils';

export async function GET({ url }) {
    const query = url.searchParams.get('query');
    const autocomplete = url.searchParams.get('autocomplete');

    if (autocomplete) {
        const hostname = getHostname(autocomplete);
        const suggestions = database.searchSessions(hostname);

        return json({ suggestions });
    }

    if (!query)
        return error(400, 'No query included');

    // Check if a URL or IP address
    if (isIPv4(query)) {
        const result = await database.getNetwork(query);
        if (!result.success)
            return error(500, result.reason);

        if (!result.datacenter_ids)
            return error(500, 'datacenter_ids not in result');

        if (!result.network)
            return error(500, 'network not in result');

        const datacenters = database.getDatacentersFromIds(result.datacenter_ids);

        return json({ pageUrl: query, datacenters, networks: [result.network] });
    } else {
        const hostname = getHostname(query);
        if (!hostname)
            return error(400, 'Invalid hostname');

        const { entry_rows, datacenters } = database.getSession(hostname);
        if (!entry_rows.length || !datacenters.length)
            return error(400, 'No session in database');

        const entries: Record<string, Entry> = {};
        const network_ids: Set<number> = new Set();

        entry_rows.forEach(e => {
            if (e.network_id != undefined)
                network_ids.add(e.network_id);

            entries[e.ip] = { ...e, count: 1 };
        });

        const networks_list = database.getNetworksFromIds(Array.from(network_ids));
        const networkIps = getNetworkIps(entries);

        const networks = Object.fromEntries(networks_list.map(el => [el.id, el]));

        const networksDatacenters = database.getNetworksDatacenters(Array.from(network_ids), datacenters.map(el => el.id));

        return json({ pageUrl: hostname, entries, networks, datacenters, networkIps, networksDatacenters });
    }
};

export async function POST({ request }) {
    let { hostname, entries, datacenter_ids } = await request.json();

    hostname = getHostname(hostname);
    if (!hostname || !entries || !datacenter_ids)
        return error(400, 'Host, datacenter_ids or entry list not submitted');

    const result = database.insertSession(hostname, entries, datacenter_ids);
    return json({ success: result })
};
