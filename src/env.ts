import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
    AERIAL_DIR: { schema: (value) => value ? value : '/data/aerial' },
    DB_DIR: { schema: (value) => value ? value : '/data' },
    NETWORKSDB_API: { schema: (value) => building ? null : value },
    MAPBOX_API: { schema: (value) => building ? null : value }
});
