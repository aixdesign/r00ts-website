import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';
import type { RequestHandler } from './$types';

import { AERIAL_DIR } from '$env/static/private';

let IMAGE_DIR = AERIAL_DIR || 'images/aerial';

export const GET: RequestHandler = async ({ params }) => {
    // Prevent path traversal attacks
    const filename = params.filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (!filename) throw error(400, 'Invalid filename');

    try {
        const buffer = await readFile(join(IMAGE_DIR, filename));
        const mimeType = lookup(filename) || 'application/octet-stream';

        return new Response(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        throw error(404, 'Image not found');
    }
};
