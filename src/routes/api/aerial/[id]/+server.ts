import { getDatacenterAerialImage } from '$lib/server/database.js';
import { json, error } from '@sveltejs/kit'

export async function GET({ params }) {
    const { id } = params;

    //console.log(`[GET] /api/aerial/${id}`);

    if (id === null || id === undefined || id === '')
        error(400, 'Missing id');

    if (parseInt(id) < 0)
        error(400, 'Id out of range');

    const result = await getDatacenterAerialImage(parseInt(id));

    if (result)
        return json({ filename: result });
    else
        return error(400);

}
