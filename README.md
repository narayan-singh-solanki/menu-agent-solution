# Menu Agent

Fixture-backed TypeScript menu resolver plus a React inspector. It recalculates delivery and collection visibility from stock, availability, schedules, and placements, then calculates per-item gross and tax. The only server implementation is an in-process fixture stub with configurable failure and delay.

## Run

Use a Node version supported by the installed Vite release (Vite 7.3.7 requests Node 20.19+ or 22.12+). Install dependencies if `node_modules` is absent:

```bash
npm install
```

Run the fixture agent (preorder context):

```bash
npm run agent
```

Start the inspector:

```bash
npm run dev
```

Open the local URL printed by Vite. The inspector lets you choose local/hybrid/remote mode, delivery/collection, a Sydney evaluation time or preorder slot, simulated server failure/delay, and an in-memory cache. Search filters already resolved visible items. `mode` and `orderType` initialize from, and are updated in, the query string.

`npm test` runs the Vitest domain suite; `npm run build` type-checks and creates a production build. Actual verification outcomes and environment limitations are recorded in `AI-NOTES.md`.

## Not implemented

There is no live vendor integration, production backend, persistent cache, authentication, multiple-store support, checkout/modifier selection, NLP, deployment, Expo app, or Maestro flow. The remote and hybrid paths use the same fixture-backed domain engine through the in-process stub, so they do not demonstrate independently deployed server rules.
