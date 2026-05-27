import path from 'path';

import Database from 'better-sqlite3';
import { migrate } from '@blackglory/better-sqlite3-migrations';

import { type Note, type Datacenter, type Network, NoteType, type PostResult } from '$lib/types';

import { NETWORKSDB_API } from '$env/static/private';
import { CONTINENT_COUNTRY_LIST, COUNTRY_CODE_TO_NAME } from './countries';

if (!NETWORKSDB_API)
    console.warn("NETWORKSDB_API not set! Cannot fetch new ip block info.");
else
    console.log("NETWORKSDB_API found");


// Setup SQLite database connection
const db = new Database('r00ts.db');
db.pragma('journal_mode = WAL');

import { findMigrationFilenames, readMigrationFile } from 'migration-files'
import { intToIP, IPtoInt } from './ip_utils';

const filenames = await findMigrationFilenames(path.join(process.cwd(), 'src/lib/server/migrations'));
const migrations = await Promise.all(filenames.map(readMigrationFile));

migrate(db, migrations);

// Convenience methods to interact with the database
export function getAllNotes() {
    const notes = db.prepare("SELECT * FROM Notes").all() as Note[];
    return { notes };
}

export function getNotes(id?: number, datacenter_id?: number | null) {
    let statement;
    let args: number[] = [];
    if (id != undefined) {
        statement = db.prepare('SELECT * FROM Notes WHERE id = ?');
        args = [id];
    } else if (datacenter_id != undefined) {
        statement = db.prepare('SELECT * FROM Notes WHERE datacenter_id = ?');
        args = [datacenter_id];
    } else {
        return getAllNotes();
    }

    const notes = statement.all(args);
    return { notes };
}

export function addNote(type: NoteType, title?: string, url?: string, body?: string, datacenter_id?: number | null): PostResult {
    console.log("addNote:", title, url, body, type, datacenter_id);

    if (type == NoteType.Article) {
        if (!title || !url)
            return { success: false, code: 400, reason: 'title and url must be provided' };
    } else if (type == NoteType.Image) {
        if (!url)
            return { success: false, code: 400, reason: 'url must be provided' };

        const image_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.webp'];
        if (!image_extensions.some((val) => url.endsWith(val)))
            return { success: false, code: 400, reason: 'url not accepted image type' };
    } else if (type == NoteType.Comment) {
        if (!body || !datacenter_id)
            return { success: false, code: 400, reason: 'body and datacenter_id must be provided' };
    } else {
        return { success: false, code: 400, reason: 'note type not valid' };
    }

    const timestamp = Math.floor(Date.now() / 1000);

    try {
        const statement = db.prepare('INSERT INTO Notes(type, title, url, body, datacenter_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
        const result = statement.run(type, title, url, body, datacenter_id, timestamp);

        console.log(result);
    } catch (error) {
        console.error(error);
        return { success: false, code: 500, reason: 'Error adding note to database' };
    }

    return { success: true, code: 201 };
}

export async function getNetwork(ip: number | string) {
    let ip_int: number;
    let ip_str: string;

    if (typeof ip === 'number') {
        ip_str = intToIP(ip);
        ip_int = ip;
    }
    else {
        ip_str = ip;
        ip_int = IPtoInt(ip);
    }

    if (ip_int == -1)
        return { success: false, reason: 'Invalid IP address' };

    let net = db.prepare('SELECT * FROM Networks WHERE ? BETWEEN start_int AND end_int').get(ip_int);

    if (!net) {
        // Not in local database, fetch from NetworksDB
        if (!NETWORKSDB_API) {
            console.warn("NETWORKSDB_API not set, cannot complete request");
            return { success: false, reason: 'No access token for NetworksDB' };
        }

        const params = new URLSearchParams({ ip: ip_str });
        const result = await fetch(`https://networksdb.io/api/ip-info?${params}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': NETWORKSDB_API
            }
        });

        const data = await result.json();

        const { organisation, network, asn } = data;
        const organisation_name = organisation.name;
        const { netname: network_name, description, first_ip: ip_start, last_ip: ip_end, cidr } = network;
        let as_number = null;
        if (asn && asn.asn)
            as_number = asn.asn;

        const start_int = IPtoInt(ip_start);
        const end_int = IPtoInt(ip_end);

        let id;

        try {
            const stmt = db.prepare("INSERT INTO Networks(organisation_name, network_name, description, ip_start, ip_end, start_int, end_int, ip_cidr, asn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            const result = stmt.run([organisation_name, network_name, description, ip_start, ip_end, start_int, end_int, cidr, as_number]);
            id = result.lastInsertRowid;
        } catch (error) {
            console.error("Error inserting into Networks:");
            console.error(error);
            return { success: false, reason: 'Error inserting into Networks' };
        }

        net = {
            id,
            organisation_name,
            network_name,
            description,
            ip_start,
            ip_end,
            start_int,
            end_int,
            ip_cidr: cidr,
            asn: as_number,
            identified: 0,
        }
    }

    return { success: true, result: net };
}

async function findDatacenters(net_id: number, country_code: string | null, level: number = 1) {
    const fac_url_base = "https://peeringdb.com/api/netfac";
    const searchParams = new URLSearchParams({ net_id: net_id.toString() });

    if (country_code && level != 3) {
        if (level == 1) {
            searchParams.append('country__in', country_code);
        }
        else if (level == 2) {
            let neighbours = [country_code];
            for (const continent of Object.keys(CONTINENT_COUNTRY_LIST)) {
                if (CONTINENT_COUNTRY_LIST[continent].includes(country_code)) {
                    neighbours = CONTINENT_COUNTRY_LIST[continent];
                    break;
                }
            }
            searchParams.append('country__in', neighbours.join(','));
        }
    }

    let fac_url = `${fac_url_base}?${searchParams.toString()}`;

    let fac_info = await fetch(fac_url).then(r => r.json()).catch(err => {
        console.error("Error fetching from peeringdb");
        console.error(err);
        return { data: [] };
    });

    fac_info.data.forEach((val: any, index: number) => {
        val['country_name'] = COUNTRY_CODE_TO_NAME[val.country];
        fac_info.data[index] = val
    });

    return fac_info;
}


export async function getDatacenters(asn: string, country_code: string | null, level: number)
    : Promise<{ success: boolean, reason?: string, facilities?: Datacenter[] }> {

    if (!asn)
        return { success: false, reason: 'ASN not provided' };

    let net = db.prepare('SELECT * FROM Networks WHERE asn = ?').get([asn]) as Network;

    if (!net)
        return { success: false, reason: `Network with ASN ${asn} not known to database` };

    let facility_query_params: (string | number)[] = [asn];
    let facility_query = `
        SELECT * FROM Datacenters
        JOIN NetworksDatacenters ON Datacenters.id = NetworksDatacenters.datacenter_id
        JOIN Networks ON Networks.id = NetworksDatacenters.network_id
        WHERE Networks.asn = ?
    `;

    if (country_code) {
        facility_query += ' AND Datacenters.country_code LIKE ?';
        facility_query_params.push(country_code);
    }

    const facilities = db.prepare(facility_query).all(facility_query_params) as Datacenter[];
    console.log()
    console.log('number of facilities in database:', facilities.length);

    if (facilities && facilities.length > 0) {
        return { success: true, facilities };
    }

    // Fetch facility info from PeeringsDB
    console.log("Fetching facility info from PeeringsDB...");
    const net_info = await fetch(`https://peeringdb.com/api/net?asn=${asn}`)
        .then(r => r.json())
        .catch(err => err);

    let net_id;
    try {
        net_id = net_info['data'][0]['id'];
    } catch (error) {
        return { success: false, reason: `Error: ${error}` }
    }

    let fac_info = await findDatacenters(net_id, country_code, level);

    if (country_code) {
        while (level < 3 && (!fac_info || !fac_info.data || fac_info.data.length == 0)) {
            level += 1;
            console.log(`No Datacenters found, increasing level to ${level}`);
            fac_info = await findDatacenters(net_id, country_code, level)
        }
    }

    if (fac_info.length == 0)
        return { success: false, reason: "No Datacenters found" };

    console.log("Fetching location data of datacenters...");
    const fac_ids = fac_info.data.map((el: any) => el.fac_id);
    const fac_url_base = "https://peeringdb.com/api/fac";
    const searchParams = new URLSearchParams();
    searchParams.append('id__in', fac_ids.join(','));

    let fac_url = `${fac_url_base}?${searchParams.toString()}`;

    const fac_info_details = await fetch(fac_url)
        .then(res => res.json())
        .catch(err => {
            console.log(err);
            return fac_info;
        });

    fac_info_details.data.forEach((val: any, index: number) => {
        val['country_name'] = COUNTRY_CODE_TO_NAME[val.country];
        fac_info_details.data[index] = val
    });

    // Add to database
    const updated = Date.now();
    const insert_clause = 'INSERT INTO Datacenters(fac_id, name, lat, lon, city, country_code, last_update) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const upsert_clause = 'ON CONFLICT DO UPDATE SET (fac_id, name, lat, lon, city, country_code, last_update) = (?, ?, ?, ?, ?, ?, ?)';
    const insert = db.prepare(`${insert_clause} ${upsert_clause}`);
    const xref_insert = db.prepare('INSERT INTO NetworksDatacenters(network_id, datacenter_id) VALUES (?, ?) ON CONFLICT DO NOTHING');

    for (const detail of fac_info_details.data) {
        const parameters = [detail.id, detail.name, detail.latitude, detail.longitude, detail.city, detail.country, updated];
        const result = insert.run(parameters.concat(parameters));
        console.log('lastInsertRowid: ', result.lastInsertRowid, 'network_id:', net.id);
        if (result.lastInsertRowid > 0) {
            xref_insert.run([net.id, result.lastInsertRowid]);
        }
    }

    return { success: true, facilities: fac_info_details.data };

}
