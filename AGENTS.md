# Project instructions

## Source and architecture

- Treat `src/fixtures/` as the only domain-data source. Do not call vendor or third-party services, and preserve opaque identifiers exactly. `parseCatalogFixture` converts numeric `external_ref` tokens to strings before JSON parsing can lose precision.
- The assignment brief is `task.html`. Fixtures define supplied data; working notes in the brief are unverified and must be reconciled in `docs/CONFLICTS.md`.
- Keep resolver, schedule, pricing, normalization, and mode routing in `src/domain/`. Keep inspector state, money formatting, search, and query-string handling in `src/App.tsx` and `src/components/`.
- The current inspector uses one fixed fixture store and an in-memory `FixtureSnapshot`; it is not a persistent or multi-store cache.

## Current domain behavior to preserve unless deliberately changing it

- `resolveAvailability` ignores catalog-level `visible`. It recomputes each order type from `available === true`, positive stock, `isWithinSchedule`, and the presence of that order type's placement.
- A schedule is evaluated in `ctx.timezone` at `preorder_slot` when supplied, otherwise `now`. Current code supports start-inclusive, end-exclusive, same-day windows only; overnight/equal ranges throw.
- Prices remain integer minor units until `MenuResults` formats them. `calculatePriceAndTax` extracts tax for inclusive pricing, adds it for exclusive pricing, makes `exempt` tax zero, and uses integer half-up rounding.
- The current resolver treats any non-`exempt` runtime tax class as standard. Fixtures only use `standard` and `exempt`; do not document unknown values as validated unless validation is added.
- `modifier_ids` and modifier records are returned as catalog data, but modifier prices are not included in resolved item prices.
- `resolveMenu` gives each server operation one `Promise.race` budget (3,000 ms by default), does not retry, and falls back to `resolveLocal` from the supplied cache on an operation error or timeout. Local and hybrid modes require a cache; a successful remote result does not. The timed-out operation is not cancelled.

## Documentation and verification

- When behavior, decisions, or verification change, update `README.md`, `AI-NOTES.md`, `docs/FIELD-MAPPING.md`, and `docs/CONFLICTS.md` to describe the implementation truthfully.
- After domain changes, run `npm test` and `npm run build`. Run `npm run agent` when checking the fixture output. Record failed or unavailable checks accurately in `AI-NOTES.md`.
- Do not claim browser or 390px verification without starting the inspector and inspecting it. Do not overwrite unrelated working-tree or staged changes.
