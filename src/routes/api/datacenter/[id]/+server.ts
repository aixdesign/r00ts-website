import { error } from '@sveltejs/kit';

import { getDatacenter } from '#lib/server/database.js';

export async function GET({ params }) {
    const { id } = params;

    if (id === null || id === undefined || id === '')
        error(400, 'Missing id');

    if (parseInt(id) < 0)
        error(400, 'Id out of range');

    const { datacenter, networks } = await getDatacenter(parseInt(id));

    return Response.json({ datacenter, networks });
}
