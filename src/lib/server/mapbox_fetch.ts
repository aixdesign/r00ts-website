import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { MAPBOX_API, AERIAL_DIR } from '$env/static/private';

const MAPBOX_STATIC_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static";
let IMAGE_DIR = AERIAL_DIR || 'images/aerial';

export async function fetchSatilliteView(
    lng: number,
    lat: number,
    zoom: number = 16,
    width: number = 350,
    height: number = 350
): Promise<{ success: boolean, filename?: string, reason?: string }> {

    if (!MAPBOX_API) {
        console.error("MAPBOX_API not set");
        return { success: false, reason: 'MAPBOX_API token not found' };
    }

    const queryParams = new URLSearchParams({
        'attribution': 'false',
        'logo': 'false',
        'access_token': MAPBOX_API
    });

    let url = `${MAPBOX_STATIC_URL}/${lng},${lat},${zoom},0/${width}x${height}?${queryParams.toString()}`;
    console.log(url);

    await mkdir(IMAGE_DIR, { recursive: true });
    console.log(`Saving aerial images to ${IMAGE_DIR}`);

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Mapbox returned status ${response.status} ${response.statusText}`);
        return { success: false, reason: `Mapbox returned status ${response.status} ${response.statusText}` };
    }

    const filename = `${crypto.randomUUID()}.png`;
    console.log(filename);

    const buffer = Buffer.from(await response.arrayBuffer());
    const filepath = join(IMAGE_DIR, filename);

    await writeFile(filepath, buffer);
    console.log("Saved successfully");

    return { success: true, filename };
}
