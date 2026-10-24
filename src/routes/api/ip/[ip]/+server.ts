import { error } from '@sveltejs/kit';

import { getNetwork, getDatacenters } from '#lib/server/database.js';
import { isIpReserved, IPtoInt, isIPv4 } from '#lib/ip_utils.js';

export async function GET({ params, url, getClientAddress }) {
    const { ip } = params;
    let country_code = url.searchParams.get('country_code') ?? undefined;
    let city = url.searchParams.get('city') ?? undefined;

    console.log(`[GET] /api/ip/${ip} country_code: ${country_code} city: ${city}`);

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

    let user;
    if (!country_code) {
        const userIP = getClientAddress();

        if (import.meta.env.DEV) {
            country_code = 'nl';
            console.log('In DEV mode');
        } else if (!userIP.includes('127.0.0.1')) {
            const data = await fetch(`http://ip-api.com/json/${userIP}`).then(res => res.json()).catch(err => console.log(err));

            if (data.status === 'fail') {
                console.log("WARNING: country_code could not be resolved");
                console.log(data);
            } else
                country_code = data.countryCode as string;

        }

        console.log(`Setting user country_code to ${country_code}`);
        user = { country_code };
    }

    const facilitiesRequest = await getDatacenters(networkRequest.network.asn, country_code, city);

    if (!facilitiesRequest.success)
        error(500, facilitiesRequest.reason);

    if (!facilitiesRequest.facilities)
        error(500, facilitiesRequest.reason);

    return Response.json({ facilities: facilitiesRequest.facilities, network: networkRequest.network, user });
}
