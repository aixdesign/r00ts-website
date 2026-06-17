import { json, error } from '@sveltejs/kit';

import * as database from '$lib/server/database.js';

export async function GET({ url }) {
    const search_note_id = url.searchParams.get('id');
    let note_id;
    if (search_note_id != null)
        note_id = parseInt(search_note_id);

    const search_datacenter_id = url.searchParams.get('datacenter_id');
    //console.log(search_datacenter_id);
    let datacenter_id;
    if (search_datacenter_id != null)
        datacenter_id = parseInt(search_datacenter_id);

    const result = database.getNotes(note_id, datacenter_id);
    return json(result);
};

export async function POST({ request }) {
    const { title, url, body, type, datacenter_id } = await request.json();

    const result = database.addNote(type, title, url, body, datacenter_id);
    if (result.success)
        return json(result);
    else
        return error(result.code, result.reason);
};
