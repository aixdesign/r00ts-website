import { json, error } from '@sveltejs/kit';

import { isIP, isIPv6 } from 'net';

import { getNetwork, getDatacenters } from '$lib/server/database';
import { isIpReserved, IPtoInt } from '$lib/server/ip_utils.js';

export async function GET({ params, url, getClientAddress }) {
    const { ip } = params;
    let country_code = url.searchParams.get('country_code');
    let city = url.searchParams.get('city') ?? undefined;

    console.log(`[GET] /api/ip/${ip} country_code: ${country_code} city: ${city}`);

    if (!ip)
        error(400, 'Missing IP address');

    if (isIP(ip) == 0)
        error(400, 'IP is not valid');

    if (isIPv6(ip))
        error(400, 'IPv6 is not supported');

    const ip_int = IPtoInt(ip);
    if (isIpReserved(ip_int))
        return json({ reserved: true });

    const networkRequest = await getNetwork(ip_int);
    if (!networkRequest.success)
        error(500, networkRequest.reason);

    if (!networkRequest.network?.asn)
        error(500, 'ASN not found for network');

    let user;
    if (!country_code) {
        const userIP = getClientAddress();
        const data = await fetch(`http://ip-api.com/json/${userIP}`).then(res => res.json()).catch(err => console.log(err));

        if (data.status === 'fail') {
            console.log("WARNING: setting default country_code to 'nl'");
            country_code = 'nl';
        } else
            country_code = data.countryCode as string;

        user = { country_code };
    }

    const facilitiesRequest = await getDatacenters(networkRequest.network.asn, country_code, city);

    if (!facilitiesRequest.success)
        error(500, facilitiesRequest.reason);

    if (!facilitiesRequest.facilities)
        error(500, facilitiesRequest.reason);

    return json({ facilities: facilitiesRequest.facilities, network: networkRequest.network, user });
}
