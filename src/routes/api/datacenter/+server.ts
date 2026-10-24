import * as database from '#lib/server/database.js';

export async function GET() {
    const datacenters = database.getAllDatacenters();

    return Response.json({ datacenters });
}
