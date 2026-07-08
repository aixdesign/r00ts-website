import { json } from '@sveltejs/kit';

import * as database from '$lib/server/database.js';

export async function GET() {
    console.log("[GET] api/datacenter");

    const datacenters = database.getAllDatacenters();

    return json({ datacenters });
}
