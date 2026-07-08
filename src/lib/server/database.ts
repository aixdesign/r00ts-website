import path from 'path';

import { migrate } from '@blackglory/better-sqlite3-migrations';
import Database from 'better-sqlite3';

import type { City, Datacenter, Entry, EntryRow, Facility, IpBlock, Network, Note, PostResult, Session } from '$lib/types';
import { NoteType } from '$lib/types';

import { NETWORKSDB_API } from '$env/static/private';
import { CONTINENT_COUNTRY_LIST } from './countries';

if (!NETWORKSDB_API)
    console.warn("NETWORKSDB_API not set! Cannot fetch new ip block info.");
else
    console.log("NETWORKSDB_API found");


// Setup SQLite database connection
const db = new Database('r00ts.db');
db.pragma('journal_mode = WAL');

import { intToIP, IPtoInt } from '$lib/ip_utils';
import { findMigrationFilenames, readMigrationFile } from 'migration-files';
import { fetchSatilliteView } from './mapbox_fetch';
import { getFacilitiesFromASN, getPeeringDBNetwork } from './peeringdb';

const filenames = await findMigrationFilenames(path.join(process.cwd(), 'src/lib/server/migrations'));
const migrations = await Promise.all(filenames.map(readMigrationFile));

migrate(db, migrations);

// Convenience methods to interact with the database
function tableInsert(table: string, parameters: Record<string, any>, on_conflict?: string) {
    const keys = Object.keys(parameters);
    const values = Object.values(parameters);
    const placeholder = keys.map(_ => "?").join(',');
    const conflict_clause = on_conflict ? `ON CONFLICT ${on_conflict}` : '';
    const statement = `INSERT INTO ${table}(${keys.join(',')}) VALUES(${placeholder}) ${conflict_clause}`;
    return db.prepare(statement).run(values);
}

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

export async function getNetwork(ip: number | string)
    : Promise<{ success: boolean, reason?: string, network?: Network, datacenter_ids?: number[] }> {
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

    let ipBlock: IpBlock = db.prepare(
        'SELECT * FROM IpBlocks WHERE ? BETWEEN start_int AND end_int'
    ).get([ip_int]) as IpBlock;

    if (ipBlock) {
        try {
            let network = db.prepare('SELECT * FROM Networks WHERE id = ?').get([ipBlock.network_id]) as Network;
            let datacenter_ids = db.prepare('SELECT datacenter_id FROM NetworksDatacenters WHERE network_id = ?')
                .all(ipBlock.network_id)
                .map((row: any) => row.datacenter_id) as number[];
            return { success: true, network, datacenter_ids };
        } catch (err) {
            console.error(`Error getting Network with id ${ipBlock.network_id}`);
            console.error(err);
            return { success: false, reason: "Error getting network for ip block" };
        }
    }

    // Ip block not seen before, fetch from NetworksDB
    if (!NETWORKSDB_API) {
        console.warn("NETWORKSDB_API not set, cannot complete request");
        return { success: false, reason: 'No access token for NetworksDB' };
    }

    const params = new URLSearchParams({ ip: ip_str });
    const data = await fetch(`https://networksdb.io/api/ip-info?${params}`, {
        method: 'GET',
        headers: {
            'X-Api-Key': NETWORKSDB_API
        }
    })
        .then(res => res.json())
        .catch(err => {
            console.log('Error fetching from networksdb');
            console.error(err)
        })

    if (!data) {
        console.log('data is undefined');
        return { success: false, reason: 'Failed to connect to networksdb' };
    }

    const { organisation, network, asn: as_number } = data;
    const asn = as_number.asn;
    const organisation_name = organisation.name;
    let { netname: network_name, description, first_ip: ip_start, last_ip: ip_end, cidr } = network;

    // in the case that the IP range does not conform to CIDR format (i.e. range not a power of 2)
    if (cidr === 'N/A')
        cidr = `${ip_start} to ${ip_end}`;

    // Find if Network already exist in DB
    let network_asn = db.prepare("SELECT * FROM Networks WHERE asn = ?").get([asn]) as Network;
    let network_id;

    if (network_asn) {
        network_id = network_asn.id;
    } else {

        const peering_net = getPeeringDBNetwork(asn);

        let peering_net_id;
        if (peering_net)
            peering_net_id = peering_net.id;
        else
            console.log(`Cannot find ${asn} in peeringdb`);

        const network_params = {
            net_id: peering_net_id,
            network_name,
            organisation_name,
            description,
            asn,
            last_update: 0
        };

        const result = tableInsert('Networks', network_params);
        network_id = result.lastInsertRowid as number;

        network_asn = {
            id: network_id,
            ...network_params
        };
    }

    // Create IpBlocks entry
    const start_int = IPtoInt(ip_start);
    const end_int = IPtoInt(ip_end);

    const ip_params = {
        ip_start,
        ip_end,
        start_int,
        end_int,
        network_id,
        ip_cidr: cidr
    };

    try {
        tableInsert('IpBlocks', ip_params);
    } catch (err) {
        console.log("Error adding ip block:");
        console.log(ip_params);
        console.log(err);
        return { success: false, reason: 'Error adding ip block to database' };
    }

    let datacenter_ids = db.prepare('SELECT datacenter_id FROM NetworksDatacenters WHERE network_id = ?')
        .all(network_id)
        .map((row: any) => row.datacenter_id) as number[];

    return { success: true, network: network_asn, datacenter_ids };
}

function getNeighbours(country_code: string) {
    const cc = country_code.toUpperCase();
    let neighbours = [cc];
    for (const continent of Object.keys(CONTINENT_COUNTRY_LIST)) {
        if (CONTINENT_COUNTRY_LIST[continent].includes(cc)) {
            neighbours = CONTINENT_COUNTRY_LIST[continent];
            break;
        }
    }
    return neighbours;
}

export async function getDatacenter(id: number) {
    if (id < 0)
        return { success: false, reason: `id ${id} is out of range` };

    let datacenter = db.prepare('SELECT * FROM Datacenters WHERE id = ?').get([id]) as Datacenter;

    if (!datacenter)
        return { success: false, reason: `Data center not found with id ${id}` };

    return { success: true, datacenter }
}

function iterativeSearch(asn: number, country_code?: string, city?: string): Datacenter[] {

    const select_clause = `
        SELECT d.id, d.fac_id, d.name, d.lat, d.lon, d.precise, d.city, d.country_code, d.links, d.last_update FROM Datacenters d
        JOIN NetworksDatacenters ON d.id = NetworksDatacenters.datacenter_id
        JOIN Networks ON Networks.id = NetworksDatacenters.network_id
        WHERE Networks.asn = ?
    `;
    const country_clause = 'AND d.country_code LIKE ?';
    const city_clause = 'AND ( d.city LIKE ? OR d.name LIKE ?)'; // city might be in name too

    let facility_query = [select_clause];
    let facility_query_params: (string | number)[] = [asn];

    if (country_code) {
        facility_query.push(country_clause);
        facility_query_params.push(country_code.toUpperCase());
    }

    if (city) {
        facility_query.push(city_clause);
        facility_query_params.push(`%${city}%`);
        facility_query_params.push(`%${city}%`);
    }

    console.log(" - 1 Initial search...");
    let facilities = db.prepare(facility_query.join(' ')).all(facility_query_params) as Datacenter[];

    if (city && facilities.length > 0)
        console.log('  Found results that matched city!');

    if (facilities && facilities.length > 0)
        return facilities;


    if (city && country_code) {
        // Drop city search
        facility_query = [select_clause, country_clause];
        facility_query_params = [asn, country_code];

        console.log(" - 1B Trying without city");
        facilities = db.prepare(facility_query.join(' ')).all(facility_query_params) as Datacenter[];

        if (facilities && facilities.length > 0)
            return facilities;
    }

    if (!country_code) {
        // First search was already entire world, return empty...
        return [];
    }

    // If country code, broaden search to include continent...
    const neighbours = getNeighbours(country_code);
    const placeholders = neighbours.map(_ => "?").join(',');
    const neighbour_clause = `AND d.country_code IN (${placeholders})`;
    facility_query = [select_clause, neighbour_clause];
    facility_query_params = [asn, ...neighbours];

    console.log(" - 2 Attempting continent...");
    facilities = db.prepare(facility_query.join(' ')).all(facility_query_params) as Datacenter[];

    if (facilities && facilities.length > 0)
        return facilities;

    // Otherwise try worldwide...
    console.log(" - 3 Attempting worldwide...");
    facilities = db.prepare(select_clause).all(asn) as Datacenter[];

    return facilities;
}

export async function getDatacenters(asn: number, country_code?: string, city?: string)
    : Promise<{ success: boolean, reason?: string, facilities?: Datacenter[] }> {

    if (!asn)
        return { success: false, reason: 'ASN not provided' };

    let net = db.prepare('SELECT * FROM Networks WHERE asn = ?').get([asn]) as Network;

    if (!net)
        return { success: false, reason: `Network with ASN ${asn} not known to database` };

    let facilities: Datacenter[] = [];

    // Only search if database is up to date
    const now = Math.floor(Date.now() / 1000);
    if (net.last_update >= now - (7 * 24 * 60 * 60)) {
        facilities = iterativeSearch(asn, country_code, city);
        console.log(`Found ${facilities.length} facilities`);

        if (facilities && facilities.length > 0) {
            return { success: true, facilities };
        }
    }

    // Fetch facility info from PeeringDB
    console.log("Fetching facility info from PeeringsDB...");

    // Fetch all facilities on network
    const peeringdbFacilities = getFacilitiesFromASN(asn);

    const last_update = Math.floor(Date.now() / 1000);

    const insert_clause = 'INSERT INTO Datacenters(fac_id, name, lat, lon, precise, city, country_code, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const upsert_clause = 'ON CONFLICT DO UPDATE SET (last_update) = (?)';
    const insert = db.prepare(`${insert_clause} ${upsert_clause} RETURNING id`);
    const xref_insert = db.prepare('INSERT INTO NetworksDatacenters(network_id, datacenter_id) VALUES (?, ?) ON CONFLICT DO NOTHING');

    const doinsert = db.transaction((params: any[], last_update: number) => {
        const row = insert.get([...params, last_update]) as Datacenter;

        xref_insert.run(net.id, row.id);
    });

    peeringdbFacilities.forEach(async (fac: Facility) => {
        let { latitude, longitude } = fac;
        let precise = 1;

        // console.log(`lat/lon: ${latitude} ${longitude}`);

        if (latitude === null || longitude === null) {
            precise = 0;

            const cityRow = db.prepare('SELECT * FROM Cities WHERE name LIKE ? AND country_code LIKE ?').get(fac.city, fac.country) as City;
            if (!cityRow) {
                const cityData = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${fac.city}&countrycodes=${fac.country}&format=jsonv2&limit=1`,
                    {
                        headers: {
                            'User-Agent': "DatacenterMap/1.0"
                        }
                    }

                )
                    .then(res => res.json())
                    .catch(console.error);

                if (!cityData) {
                    console.error(`No city data found for ${fac.city} ${fac.country}`);
                    return;
                }

                latitude = cityData[0].lat;
                longitude = cityData[0].lon;

                tableInsert(
                    'Cities',
                    { name: fac.city, country_code: fac.country, lat: latitude, lon: longitude },
                    'DO NOTHING'
                );
            } else {
                latitude = cityRow.lat;
                longitude = cityRow.lon;
            }
        }

        const parameters = [fac.id, fac.name, latitude, longitude, precise, fac.city, fac.country, last_update]
        doinsert(parameters, last_update);
    });

    // Update network last_time
    db.prepare('UPDATE Networks SET last_update = ? WHERE id = ?').run(last_update, net.id)

    // Now perform iterativeSearch again...
    facilities = iterativeSearch(asn, country_code, city);
    console.log(`Found ${facilities.length} facilities`);

    return { success: true, facilities };
}

export function getNetworksFromIds(ids: number[]) {
    if (!ids || ids == undefined || !ids.length)
        return [];

    const placeholder = ids.map(_ => "?").join(',');
    return db.prepare(`SELECT * FROM Networks WHERE id IN (${placeholder})`).all(ids) as Network[];
}

export function getAllDatacenters(): Datacenter[] {
    return db.prepare(`SELECT * FROM Datacenters `).all() as Datacenter[];
}

export function getDatacentersFromIds(ids: number[]): Datacenter[] {
    const placeholder = ids.map(_ => "?").join(',');
    const datacenters = db.prepare(`SELECT * FROM Datacenters WHERE id IN (${placeholder})`).all(ids) as Datacenter[];

    let count = 0;
    for (const dc of datacenters) {
        if (dc.filename)
            continue;

        //console.log('getDatacentersFromIds dc.filename is undefined, fetching aerial view...');
        fetchSatilliteView(dc.lon, dc.lat).then(res => {
            if (!res.success || !res.filename)
                return;

            updateDatacenterFilename(dc.id, res.filename);
        });

        count += 1;

        // limit number of API requests
        if (count > 5)
            break;
    }

    return datacenters;
}

export function getNetworksDatacenters(network_ids: number[], datacenter_ids: number[]) {
    const result: Record<number, number[]> = {};

    const network_placeholder = network_ids.map(_ => "?").join(',');
    const datacenter_placeholder = datacenter_ids.map(_ => "?").join(',');

    const rows = db.prepare(`
        SELECT * FROM NetworksDatacenters 
        WHERE network_id IN ( ${network_placeholder} ) AND datacenter_id IN ( ${datacenter_placeholder} )
    `).all(...network_ids, ...datacenter_ids) as { network_id: number, datacenter_id: number }[];

    rows.forEach(el => {
        if (result[el.network_id] != undefined)
            result[el.network_id].push(el.datacenter_id);
        else
            result[el.network_id] = [el.datacenter_id];
    });

    return result;
}

export async function getDatacenterAerialImage(id: number): Promise<string | null> {
    try {
        const { lat, lon, filename } = db.prepare('SELECT lat, lon, filename FROM Datacenters WHERE id = ?').get(id) as Datacenter;

        if (filename)
            return filename;

        //console.log(filename);
        //console.log(`getDatacenterAerialImage filename from db for id ${id} is not defined. Fetching aerial view...`);
        const res = await fetchSatilliteView(lon, lat);
        if (!res.success || !res.filename)
            return null;

        updateDatacenterFilename(id, res.filename);
        return res.filename;

    } catch (err) {
        console.error(`Error fetching coordinates of ${id}`);
        console.error(err);
        return null;
    }
}

export function updateDatacenterFilename(id: number, filename: string) {
    try {
        db.prepare('UPDATE Datacenters SET filename = ? WHERE id = ?').run(filename, id);
    } catch (err) {
        console.error(`Error updating datacenter ${id}`);
        console.error(err);
    }
}

export function insertSession(hostname: string, entries: Record<string, Entry>, datacenter_ids: number[]) {
    if (!hostname)
        return false;

    const submitted = Math.floor(Date.now() / 1000);

    tableInsert('Sessions', { hostname, submitted }, "DO NOTHING");
    const session = db.prepare("SELECT * FROM Sessions WHERE hostname = ?").get(hostname) as Session;
    if (!session)
        return false;

    const session_id = session.id;
    for (const entry of Object.values(entries)) {
        tableInsert(
            'Entries',
            { hostname: entry.hostname, ip: entry.ip, network_id: entry.network_id, submitted },
            "DO NOTHING"
        );
        const entry_row = db.prepare("SELECT * FROM Entries WHERE hostname = ? AND ip = ?").get(entry.hostname, entry.ip) as EntryRow;
        const entry_id = entry_row.id as number;

        tableInsert('SessionEntries', { session_id, entry_id }, "DO NOTHING");
    }

    for (const datacenter_id of datacenter_ids)
        tableInsert('SessionsDatacenters', { session_id, datacenter_id }, "DO NOTHING");

    return true;
}

export function getSession(hostname: string) {
    if (!hostname)
        return { entry_rows: [], datacenters: [] };

    const session_row = db.prepare("SELECT * FROM Sessions WHERE Sessions.hostname = ?").get(hostname) as Session | null;
    if (!session_row)
        return { entry_rows: [], datacenters: [] };

    const session_select = `
        SELECT e.id, e.hostname, e.ip, e.network_id FROM Entries e
        JOIN SessionEntries ON e.id = SessionEntries.entry_id
        WHERE SessionEntries.session_id = ?
    `;
    const entry_rows = db.prepare(session_select).all(session_row.id) as EntryRow[];

    const datacenter_rows = db.prepare("SELECT datacenter_id FROM SessionsDatacenters WHERE session_id = ?").all(session_row.id) as { datacenter_id: number }[];
    const datacenter_ids = datacenter_rows.map(e => e.datacenter_id);

    const datacenters = getDatacentersFromIds(datacenter_ids);

    return { entry_rows, datacenters };
}

export function searchSessions(hostname: string) {
    if (!hostname)
        return [];

    const select_clause = `SELECT hostname FROM Sessions WHERE hostname LIKE ? ORDER BY submitted DESC LIMIT 10`;
    const result = db.prepare(select_clause).all(`%${hostname}%`) as { hostname: string }[];

    const suggestions = result.map(e => e.hostname);

    return suggestions;
}
