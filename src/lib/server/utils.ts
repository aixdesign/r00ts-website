import { ipCompareFn, isIPv4 } from "#lib/ip_utils.js";
import type { Entry } from "#lib/types.js";

import psl from 'psl';

export function getHostname(url: string) {
    try {
        // Need protocol for URL object to work
        if (!url.startsWith('http'))
            url = `http://${url}`;
        const urlObject = new URL(url);
        let hostname = urlObject.hostname;

        if (!isIPv4(hostname)) {
            const domain = psl.get(hostname);
            if (domain)
                hostname = domain;
        }
        return hostname;

    } catch {
        // Manual cleanup
        // remove whitespace
        url = url.trim();
        // remove protocol
        url = url.replace(/^https?:\/\//, '');
        // remove www.
        url = url.replace(/^www./, '');
        // remove path
        url = url.split('/')[0];
        return url;
    }
}


export function getNetworkIps(entries: Record<string, Entry>) {

    const result: Record<number, Entry[]> = {};

    if (!entries) return [];

    for (const [ip, entry] of Object.entries(entries)) {
        if (!entry.network_id) continue;

        if (!result[entry.network_id]) result[entry.network_id] = [];

        result[entry.network_id].push(entries[ip]);
    }

    for (const net_id of Object.keys(result))
        result[parseInt(net_id)].sort((a, b) => ipCompareFn(a.ip, b.ip));

    return result;
}

