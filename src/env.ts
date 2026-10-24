import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	AERIAL_DIR: { static: true },
	NETWORKSDB_API: { static: true },
	MAPBOX_API: { static: true }
});
