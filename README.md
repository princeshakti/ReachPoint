# ReachPoint

ReachPoint helps care teams find food, shelter, benefits, utility help and other community resources that a
patient can **actually reach**. Results are ranked by travel time for the way the patient gets around (on foot,
by bus or by car), not by straight-line distance alone.

A care worker enters where the patient is, picks what they need, and gets a live Google Map and a ranked list.
They can build a patient plan, print a plain-language handout, send it by text or email, and order the stops
into a suggested route.

## Features

- **Reach-first search.** Pick walking, public transit or driving and a travel limit (15, 30 or 45 minutes). The
  map shades the area the patient can reach, and results outside it are tucked away.
- **Live location.** Use the device's location, or type an address.
- **Real Google Map.** Pins for every result, the patient's position and the reachable area.
- **Refine without starting over.** Add or remove needs, or change the travel mode, from the results screen.
- **Open-now status.** Hours come from Google, including places that close after midnight or never close.
- **Patient plan.** Reorder stops, switch the travel mode and see times update.
- **Handout.** Print a patient-friendly page, or send the plan by text or email.
- **Route builder.** Suggests a visiting order starting from the patient's address.
- **Care-team flags.** "No ID" and "prefers Spanish" add reminders to ask when calling.
- **Private by design.** Nothing is stored on a server. Search details and the plan live in the browser's
  session storage and disappear when the tab is closed.

## How reach is calculated

Travel times are **estimates**, not turn-by-turn routing. For each place, ReachPoint takes the straight-line
distance, adds a detour allowance, and divides by a typical speed for the travel mode:

| Mode           | Speed  | Fixed overhead |
| -------------- | ------ | -------------- |
| Walking        | 3 mph  | none           |
| Public transit | 11 mph | 9 min          |
| Driving        | 24 mph | 4 min          |

The match score blends how much of the travel limit is left (65%) with whether the place is open now (35%).
Always call a place to confirm hours and eligibility before sending a patient there.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server functions) on Vite and Nitro
- TypeScript in strict mode
- Tailwind CSS v4 with a small design-token theme in `src/styles.css`
- TanStack Query for data fetching
- Google Maps Platform: Maps JavaScript API, Geocoding API, Places API (New)
- Atkinson Hyperlegible Next, a typeface designed for low-vision readers, self-hosted

## Getting started

### 1. Google Cloud setup

1. Create a project in the [Google Cloud console](https://console.cloud.google.com/) and **enable billing**.
2. Enable these three APIs: **Maps JavaScript API**, **Geocoding API** and **Places API (New)**.
3. Create an API key under _APIs & Services → Credentials_.

### 2. Run it

Requires Node.js 22.12 or newer.

```bash
npm install
cp .env.example .env     # then paste your key into .env
npm run dev
```

Open <http://localhost:5173>. Use `localhost` or an `https` address: browsers only allow the location button on
secure origins, so a LAN address such as `http://192.168.1.14:5173` will not work.

### Environment variables

| Variable                  | Required | Purpose                                                                            |
| ------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `GOOGLE_MAPS_API_KEY`     | Yes      | Used by the server for geocoding and place search, and by the browser for the map. |
| `GOOGLE_MAPS_BROWSER_KEY` | No       | A separate key for the browser map. Falls back to `GOOGLE_MAPS_API_KEY`.           |

`.env` is git-ignored. Never commit a key.

**Restricting the key.** A single key cannot be limited to your website's address, because the server's calls to
Google have no referrer. For production, create two keys: restrict the server key by API (and by IP if your host
allows), and put a second key restricted by HTTP referrer in `GOOGLE_MAPS_BROWSER_KEY`. Also set a daily quota
in Google Cloud so a leaked key cannot run up a bill.

## Scripts

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload    |
| `npm run build`     | Create a production build in `.output/` |
| `npm run start`     | Run the production build (reads `.env`) |
| `npm run typecheck` | Type-check without emitting files       |
| `npm run lint`      | Lint and check formatting               |
| `npm run format`    | Format the code with Prettier           |

## Project structure

```
src/
  routes/          Pages: / (search), /map (results), /plan (handout)
  components/
    search/        Front page: address field, reach preview, search form
    results/       Map, result cards, refine panel
    plan/          Plan editor, route builder, handout
  server/          Google calls. Keys never reach the browser bundle
  hooks/           Search and plan state, current time, hydration
  lib/             Travel model, scoring, hours, itinerary, sharing
```

Google API keys are read only in `src/server/google.server.ts`. The browser asks the server for the map key at
runtime through a server function.

## Deployment

`npm run build` produces a Node server in `.output/` (Nitro's `node-server` preset). Run it with
`npm run start` or `node .output/server/index.mjs` and set `GOOGLE_MAPS_API_KEY` in the host's environment.
For other hosts (Vercel, Netlify, Cloudflare and so on) set `NITRO_PRESET` before building; see the
[Nitro deployment docs](https://nitro.build/deploy).

## Privacy

- No database and no accounts. Patient details are never sent anywhere except Google, to look up addresses and
  places.
- Search criteria and the plan are kept in `sessionStorage` for the current tab only.
- Do not enter more patient information than the address and needs the tool asks for.

## Limitations

- Travel times are estimates. Check real routes with the **Directions** link before relying on them.
- Listings come from Google Maps and are not verified. Hours and eligibility may be out of date.
- Search covers what Google Maps knows about. Small or informal programs may be missing.
- Google Maps Platform usage is billed by Google.

## Roadmap

- Real travel times using the Routes API
- Spanish and other languages for the handout
- Saving a plan as a PDF
- Tests for the travel model and hours parsing
