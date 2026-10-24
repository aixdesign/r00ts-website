import { error } from '@sveltejs/kit';

import { getNetwork } from '#lib/server/database.js';
import { isIpReserved, IPtoInt, isIPv4 } from '#lib/ip_utils.js';

export async function GET({ params }) {

    const { ip } = params;

    if (!ip)
        error(400, 'Missing IP address');

    if (!isIPv4(ip))
        error(400, 'IP is not valid IPv4');

    const ip_int = IPtoInt(ip);
    if (isIpReserved(ip_int))
        return Response.json({ reserved: true });

    const networkRequest = await getNetwork(ip_int);
    if (!networkRequest.success)
        error(500, networkRequest.reason);

    if (!networkRequest.network?.asn)
        error(500, 'ASN not found for network');

    return Response.json({ network: networkRequest.network, datacenter_ids: networkRequest.datacenter_ids });
}

