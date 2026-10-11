# Fixture field mapping

| Fixture field | Application field / rule | Notes |
|---|---|---|
| `store.store_id` | `StoreConfig.store_id` | Must match `ctx.store_id` and `catalog.store_id`. |
| `store.timezone` | Default inspector timezone and fixture context timezone | Schedule calculation uses `ctx.timezone`; inspector initializes it from this store setting. |
| `store.currency` | `StoreConfig.currency` | `AUD` is used for presentation; prices remain integer minor units in the resolver. |
| `store.menu_agent_mode` | Initial `mode` selection | URL `mode` overrides this initial value when valid. |
| `store.tax.rate_bp` | `StoreConfig.tax.rate_bp` | Basis points; 1000 means 10%. |
| `store.tax.inclusive` | `StoreConfig.tax.inclusive` | When true, catalog price is gross and tax is extracted, not added. |
| `catalog.categories[]` | `catalog.categories[id]` | Normalize category array to an ID-keyed map. `item_ids` order is preserved. |
| `catalog.items[id]` | `catalog.items[id]` | Retain source fields and item IDs; source `visible` is discarded. |
| `items[id].schedule` | `isWithinSchedule(schedule, ctx)` | A null schedule means no time-window restriction. Evaluate at `preorder_slot` when supplied; otherwise `now`. |
| `items[id].stock`, `available` | Global eligibility and `oos` | `stock <= 0` or `available !== true` means globally unsellable. |
| `items[id].tax_class` | `calculatePriceAndTax` | `exempt` produces tax 0; `standard` uses the store rate. Unknown classes fail rather than being silently guessed. |
| `items[id].placements.delivery.price` | `prices.delivery[id]` | Integer cents, resolved for delivery only. |
| `items[id].placements.collection.price` | `prices.collection[id]` | Integer cents, resolved for collection only. |
| `categories[].item_ids` and resolver output | `visible[order_type]` | Only items passing availability, stock, schedule, and that order type's placement are listed. UI groups those IDs back under categories. |
| `catalog.modifiers[id]` | `catalog.modifiers[id]` | Normalized to a modifier ID map. |
| `modifiers[id].external_ref` | `modifiers[id].external_ref: string` | Opaque external identifier; exact digits are preserved because `9007199254740993` is not JS-safe as a number. |
| Catalog `visible` | Not mapped to resolved output | Recomputed at runtime; vendor snapshot cannot override schedule/stock rules. |
| `context.now`, `context.timezone`, `context.preorder_slot` | `ResolveContext` | `preorder_slot` overrides `now` only for schedule evaluation; returned metadata records the effective instant. |
| `resolve-local.sample.json` | Comparison aid only, not an oracle | Its visible list/prices conflict with the authoritative store and item fields; the resolver intentionally does not reproduce it. |

## Output contract

- `catalog`: normalized categories, items, and modifiers keyed by ID.
- `visible.delivery` and `visible.collection`: eligible item IDs per order type.
- `prices[order_type][item_id]`: `{ gross, tax }`, integer cents and only for visible items.
- `oos`: globally unsellable stock/availability item IDs; time-window omissions are not classified as out of stock.
