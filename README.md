# r00ts Website

> [!IMPORTANT]
> Still under construction!

Front and back-end to r00ts website and database.
Companion site to [r00ts-extension](https://github.com/al165/r00ts-extension).

Developed by [Arran Lyon](https://arranlyon.com), [Andrea Albiac](https://andreaalbiac.com/)
and [AIxDESIGN](https://aixdesign.co).
With support from [Stimulerings Fonds](https://www.stimuleringsfonds.nl/).

[![MapLibre](https://img.shields.io/badge/MapLibre-396CB2?logo=MapLibre)](https://maplibre.org/)

[![SvelteKit](https://img.shields.io/badge/SvelteKit-%23f1413d.svg?logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)

## Developing

Once you've installed dependencies with `npm install` (or `pnpm install` or
`yarn`), install a local copy of `PeeringDB` (~45Mb) in a local python
environment:

```sh
# (Optional) Create virtual environment:
python3 -m venv venv
source venv/bin/activate

# install database
pip install peeringdb

# in the wizard, set the database file to be created in r00ts-website/
peeringdb config set

# sync the database (~15mins first time)
peeringdb sync
```

Create a `.env.local` file (which will not tracked by git), and add the
following variables:

```dotenv
NETWORKSDB_API=<API_KEY>
MAPBOX_API=<API_KEY>
AERIAL_DIR=image/aerial
```

Start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

### Fonts

`r00ts.xyz` makes use [GT
Pressura](https://www.grillitype.com/typeface/gt-pressura). Due to licensing
terms, the font files are _not_ included in this repo. Either download and
install a copy of these fonts into `static/fonts/GT-Pressura`, use your own and
update the styles througout, or let the default fallback fonts be used.

### Production

To create a production version of the app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying

Using `pm2`, create an `ecosystem.config.cjs` file with the following:

```js
module.exports = {
  apps: [
    {
      name: "r00ts-website",
      script: "/usr/local/bin/node",
      args: "build",
      env: {
        NODE_ENV: "production",
        PORT: "3434",
        ADDRESS_HEADER: "X-Forwarded-For",
        XFF_DEPTH: "1",
      },
    },
  ],
};
```

Then run `$ pm2 start ecosystem.config.cjs`
