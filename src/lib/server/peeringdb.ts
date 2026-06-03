import Database from 'better-sqlite3';

import type { Facility, PeeringNetwork } from '$lib/types';

const peeringdb = new Database('peeringdb.sqlite3');

export function getFacilitiesFromASN(asn: number): Facility[] {
    if (asn < 0)
        return [];

    const select = `
        SELECT
            f.id, f.name, f.name_long, f.city, f.country, f.website, f.latitude, f.longitude
        FROM peeringdb_facility f
        JOIN
            peeringdb_network_facility nf ON f.id = nf.fac_id
        JOIN
            peeringdb_network n ON nf.net_id = n.id
        WHERE
            n.asn = ?;
    `;
    const result = peeringdb.prepare(select).all(asn) as Facility[];

    return result;
}

export function getPeeringDBNetwork(asn: number): PeeringNetwork | undefined {
    const select = `
        SELECT
            id, asn, name, name_long, website
        FROM
            peeringdb_network
        WHERE
            asn = ?
    `;

    const result = peeringdb.prepare(select).get(asn) as PeeringNetwork | undefined;

    return result;
}

