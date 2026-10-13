# AI use and verification record

## AI assistance used

AI assistance was used to scaffold and review the TypeScript resolver, React inspector, domain tests, and project documentation. The current documentation audit compared claims with the checked-in implementation, fixtures, assignment brief, and executed commands; it did not change domain logic, fixtures, or tests.

## Incorrect suggestions or assumptions rejected

- `src/fixtures/resolve-local.sample.json` is not a golden result. Compared with `catalog.official.json` and `store.json`, it includes a zero-stock item, includes lunch outside its sample-time schedule, adds tax to an exempt item, adds tax to tax-inclusive prices, and loses the delivery/collection burger price difference.
- Catalog-level `visible` is stale input, not resolver output. `resolveAvailability` recomputes it.
- Retries would violate the brief's single 3-second server budget; `resolveMenu` makes one server operation before fallback.
- `external_ref: 9007199254740993` cannot safely be represented as a JavaScript number. `parseCatalogFixture` quotes it before parsing and exposes it as a string.
- Earlier documentation incorrectly said unknown runtime tax classes fail validation. `calculatePriceAndTax` only special-cases `exempt`; another runtime value uses the standard-rate branch.

## Facts confirmed from fixtures

- `src/fixtures/store.json` defines store `s1`, `Australia/Sydney`, `AUD`, local default mode, and tax-inclusive 1,000 basis-point tax.
- At `context.sample.json` (23:00 Tuesday Sydney), `item_lunch` is outside its 11:00–14:30 schedule and `item_soldout` has stock 0. Burger and water are visible in both order types.
- `context.preorder.sample.json` evaluates at 12:30 Wednesday Sydney, so lunch joins burger and water; `item_soldout` remains in `oos`.
- At that preorder slot, fixture-backed output is: lunch 1450 gross/132 tax; burger 1299/118 delivery and 1099/100 collection; water 300/0.

## Current implementation decisions and limitations

- Resolver visible-ID order follows the catalog item-map insertion order. The inspector later groups visible IDs through category `item_ids`, so burger can appear in both supplied categories.
- Schedules are start-inclusive/end-exclusive, reject end times at or before start times, and do not support overnight windows.
- `oos` records only items rejected by availability or stock; scheduled-out items are omitted from `visible` but not added to `oos`.
- Modifiers are normalized and returned in the catalog, but neither modifier reference validity nor modifier price selection is implemented.
- The server is an in-process stub that uses the same domain functions as local mode. A timeout races the result but does not cancel the underlying stub operation.
- The inspector has fixed-store, in-memory cache state. It has no persistent cache, live API/backend, multiple stores, authentication, checkout, or mobile/Expo implementation.

## Verification executed on 2026-10-13

| Command | Outcome |
|---|---|
| `npm install` | Not run: dependencies were already present and no install was needed for the checks. |
| `npm test` | Passed: 1 test file, 14 tests. The suite includes schedule boundaries, preorder behavior, stock, pricing, inclusive/exempt/half-up tax, hybrid/remote routing, timeout fallback, and remote no-cache error. |
| `npm run build` | Passed. Vite warned that Node 18.17.0 is below its requested Node 20.19+ or 22.12+, but TypeScript and the production build completed. |
| `npm run agent` | Passed after allowing `tsx` to create its local IPC socket. It printed the preorder output described above. |
| `npm run dev -- --host 127.0.0.1` | Failed before starting a server: Node 18.17.0 lacks `crypto.hash`, used by installed Vite 7.3.7. |

## Checks still incomplete

- Browser interaction, query-parameter updates, fallback rendering, and the 390px viewport were not manually verified because the development server could not start with the available Node version.
- No Expo/Maestro check applies because this repository is a web implementation and supplies no Expo app or flows.
