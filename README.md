# Menu Agent

A fixture-backed TypeScript menu resolver with a responsive web inspector. The in-process server stub simulates server responses, delays and failures; no live vendor or third-party service is used.

## Run

Requires Node.js and npm. Install dependencies once:

```bash
npm install
```

Run the agent in one terminal to resolve and print the sample preorder menu:

```bash
npm run agent
```

Run the web inspector in another terminal:

```bash
npm run dev
```

Open the local URL printed by Vite. The inspector supports `?mode=local|hybrid|remote&orderType=delivery|collection`, store-timezone scheduling, preorder evaluation, search, server failure/delay simulation, and cache clear/restore. Server calls have one 3-second budget; on failure/timeout, the menu is recomputed locally from cache, or an error is shown if no cache exists.

## Verify

Run `npm test` and `npm run build`; record the actual results in `AI-NOTES.md`. Check the inspector at 390px width.

## Scope

Not built: live vendor/API integration, a production backend, authentication, NLP, deployment, multiple stores, a native Expo app/Maestro flows, or persistent disk cache. Web was chosen, so Maestro flows are not applicable. See `docs/FIELD-MAPPING.md` and `docs/CONFLICTS.md` for field mapping and verdicts on all 13 working notes.
