# Fixture field mapping

`src/fixtures/` is the data source. Parsing is intentionally light: apart from categories and `external_ref`, fixture data is trusted and typed rather than schema-validated.

| Source field | Application target/rule | Transformation and location | Assumption or limitation |
|---|---|---|---|
| `store.store_id` | `StoreConfig.store_id`; context identity check | `parseStoreFixture` returns the field. `validateContext` in `src/domain/resolver.ts` requires it to equal `ctx.store_id` and `catalog.store_id`. | Store configuration itself is not otherwise validated. |
| `store.timezone` | Inspector's fixed `TIME_ZONE` | `src/App.tsx` reads `fixtureSnapshot.store.timezone`; local date-time inputs are converted with `localTimeInput.ts`. | Resolver uses `ctx.timezone`, not this value; the UI always sends the store value. |
| `store.currency` | Display currency | `MenuResults.tsx` calls `Intl.NumberFormat('en-AU', { currency })`. | Prices remain integer cents in domain output. Locale is fixed to `en-AU`. |
| `store.menu_agent_mode` | Initial UI mode | `initialMode` in `App.tsx` uses it unless a valid `mode` query parameter exists. | Mode is not read from a URL change after initial render. |
| `store.tax.rate_bp`, `store.tax.inclusive` | Tax calculation | `calculatePriceAndTax` in `pricing.ts` uses basis points and the inclusive/exclusive flag. | No range validation exists for the fixture tax fields. |
| `catalog.store_id`, `catalog.fetched_at` | Normalized catalog metadata | `parseCatalogFixture` retains both fields. | `fetched_at` is returned but does not affect caching or resolution. |
| `catalog.categories[]` | `catalog.categories` keyed by ID | `parseCatalogFixture` applies `Object.fromEntries` by category ID. | Duplicate IDs overwrite earlier categories. Category order is retained by object insertion order in the UI. |
| `categories[].item_ids` | Inspector category grouping | `MenuResults.tsx` filters each category list by resolved IDs. | This presentation can show an item in multiple categories; it does not determine resolver output order. |
| `catalog.items[id]` | `catalog.items` | `parseCatalogFixture` retains the item map; `resolveAvailability` iterates it with `Object.entries`. | Visible output follows item-map insertion order and has no deduplication beyond the map keys. |
| `items[id].available`, `items[id].stock` | Eligibility and `oos` | `resolveAvailability` excludes `available !== true` or `stock <= 0` and adds the ID to sorted `oos`. | No distinct reason is returned; scheduled-out items are not `oos`. |
| `items[id].schedule.days/start/end` | Time eligibility | `isWithinSchedule` in `time.ts` uses `preorder_slot || now` in `ctx.timezone`. | Start is included; end is excluded. End must be after start; overnight ranges throw. |
| `items[id].placements.delivery/collection.price` | `prices[orderType][itemId]` and order-specific visibility | `resolveAvailability` requires a placement to add the item to that order type; `calculateClientPrices` passes its integer price to pricing. | A zero-valued placement object is allowed; only missing placements omit the item. |
| `items[id].tax_class` | Per-item tax rule | `calculatePriceAndTax` returns zero for `exempt`, standard calculation otherwise. | The TypeScript type lists `standard` and `exempt`, but runtime values are not validated. |
| `items[id].modifier_ids`, `catalog.modifiers[id]` | Returned catalog data | Item and modifier maps are retained by `parseCatalogFixture`. | Modifier references are not validated and modifier prices are not added to item prices. |
| `modifiers[id].external_ref` | `CatalogModifier.external_ref: string` | `parseCatalogFixture` quotes numeric `external_ref` tokens before `JSON.parse`, then converts to string. | Regex targets numeric `external_ref` fields; it preserves the supplied unsafe integer exactly. |
| `catalog.visible` | None | It is parsed by JSON but omitted from the `Catalog` returned by `parseCatalogFixture`. | It cannot override recomputed availability. |
| `context.now`, `context.timezone`, `context.preorder_slot` | `ResolveContext` and `meta.evaluated_at` | `validateContext` parses timestamps and validates the IANA zone; schedule and metadata use `preorder_slot || now`. | `preorder_slot` is checked only when truthy; local input conversion has no explicit DST ambiguity policy. |
| `resolve-local.sample.json` | No runtime input | Not imported by application code. | Comparison aid only; it contradicts current fixture rules. |

## Resolver output contract

`resolveLocal(ctx, catalog, store)` returns a `CoreResolution`:

- `catalog`: normalized `{ store_id, fetched_at, categories, items, modifiers }`; it excludes the raw catalog-level `visible` field.
- `visible`: `{ delivery: string[], collection: string[] }`, recomputed from availability, stock, schedule, and placement.
- `prices`: `{ delivery: Record<string, { gross, tax }>, collection: ... }`, in integer minor units and only for IDs visible in that order type.
- `oos`: alphabetically sorted IDs rejected by `available` or stock only.

`resolveMenu(options)` adds `meta` with the requested and used modes, whether fallback occurred, `preorder_slot || now`, and a failure reason only when one is supplied. Local and hybrid require a cache. Remote can return without a cache when its server result succeeds; server errors or timeout with no cache reject with `MenuAgentError` code `NO_CACHE`.
