# Working-notes conflicts log

The assignment says the fixtures and build requirements override these unverified notes. Each note gets a verdict and a fixture/brief pointer.

| # | Unverified note | Verdict | Evidence / reason |
|---:|---|---|---|
| 1 | If the dump already has `visible`, skip the schedule check. | **REJECT** | `src/fixtures/catalog.official.json` contains all item IDs in `visible`, including `item_lunch` and `item_soldout`; `context.sample.json` is 23:00 Tuesday in Sydney and the lunch schedule is 11:00–14:30. Recompute visibility. |
| 2 | Put text search in the agent so every surface matches. | **REJECT** | Brief `task.html`, “Search, theme and scrolling stay in the client.” Inspector search filters the resolved visible IDs without changing agent output. |
| 3 | In hybrid, the server prices and the client filters, because pricing is the expensive part. | **REJECT** | Brief mode table in `task.html`: hybrid = server schedule/stock, client price/tax. |
| 4 | If the server fails, return an empty menu so we never sell stale stock. | **REJECT** | Brief `task.html` requires local resolution from the last cached catalog on failure/timeout and an error only when there is no cache. |
| 5 | Retry the server 3 times, 3s each, before falling back. | **REJECT** | Brief `task.html`: any server call has a 3s **total** budget. Resolver makes one call, then falls back. |
| 6 | `available: true` is enough to show an item. | **REJECT** | `catalog.official.json` has `item_soldout.available: true` but `stock: 0`; the menu must exclude it. Schedule and order-type placement are also checked. |
| 7 | Dump prices are dollars; multiply by 100. | **REJECT** | Build contract in `task.html` explicitly requires integer cents. Values `1450`, `1299`, `1099` are consumed as cents; output is formatted as AUD only in the inspector. |
| 8 | Store time is UTC; ignore the timezone. | **REJECT** | `store.json` says `Australia/Sydney`, and both context fixtures use that timezone. `Intl.DateTimeFormat` evaluates schedule in the context's IANA timezone. |
| 9 | Delivery and collection share one price. | **REJECT** | `catalog.official.json` has burger delivery 1299 and collection 1099. Each placement is resolved separately. |
| 10 | Dump prices exclude tax; add GST on top. | **REJECT** | `store.json` says `tax.inclusive: true`; gross is the listed price and tax is extracted from gross. |
| 11 | Every item takes the store tax rate. | **REJECT** | `catalog.official.json` gives `item_water.tax_class: "exempt"`; its tax is 0. |
| 12 | Truncate tax to whole cents. | **REJECT** | Brief `task.html` explicitly says round tax to the nearest cent, half up. `roundRatioHalfUp` uses integer arithmetic. |
| 13 | For preorders, check the schedule at `now`. | **REJECT** | Brief `task.html` says when `preorder_slot` is set, judge schedule at the slot. `context.preorder.sample.json` makes lunch eligible at 12:30 Wednesday Sydney time. |
