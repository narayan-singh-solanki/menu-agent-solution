# AI notes and verification record

AI assistance was used to scaffold the resolver, inspector, test plan, and documentation. These notes distinguish source-confirmed facts from implementation choices.

## Where AI initially got things wrong / risks caught during review

- The provided `resolve-local.sample.json` must not be treated as a golden output: it includes the zero-stock pudding, includes lunch at 11 PM Sydney time, gives water a tax charge despite `tax_class: exempt`, adds tax despite `inclusive: true`, and gives delivery/collection the same burger price.
- The catalog dump is not valid strict JSON because of a trailing comma after the second category. A working copy removes that syntax error only.
- The modifier `external_ref` value `9007199254740993` exceeds JavaScript's safe-integer limit. The parser preserves its exact digits as a string at the app boundary instead of silently rounding it.
- Server retries would violate the 3-second total budget. The resolver makes one server call and falls back when that call fails or exceeds the deadline.

## Verified against supplied fixtures

- `store.json`: `Australia/Sydney`, AUD, 1000 basis points (10%), tax-inclusive.
- In `context.sample.json`, the evaluation instant is 23:00 Tuesday in Sydney. `item_lunch` is off-schedule; `item_soldout` has zero stock. Delivery/collection therefore contain the burger and water only.
- In `context.preorder.sample.json`, the slot is 12:30 Wednesday in Sydney. Lunch is scheduled and becomes visible; pudding remains excluded for zero stock.
- Inclusive tax results at that preorder slot: lunch gross 1450/tax 132 cents; burger delivery gross 1299/tax 118 cents; burger collection gross 1099/tax 100 cents; water gross 300/tax 0.
- Resolver tests cover local timezone schedule boundaries, preorder override, out-of-stock exclusion, order-type price differences, inclusive/exempt/rounding tax behavior, a 3-second timeout fallback, and failure with no cache.

## Implementation choices to explain in the follow-up

- Schedule windows are start-inclusive/end-exclusive. The provided schedules are same-day ranges; overnight ranges are rejected instead of guessed.
- `oos` contains globally unsellable stock/availability IDs; a scheduled item outside its selling window is omitted from `visible` but is not mislabeled as out of stock.
- The server is an in-process stub, explicitly allowed by the brief; it uses the same pure domain engine behind separate local/server adapters. A live API, auth, and persistent cache are intentionally not built.

## Verification record

- The domain TypeScript files compiled with the globally available TypeScript compiler, and a Node runtime smoke check confirmed the sample and preorder visibility, tax values, exact `external_ref`, failure fallback, and no-cache error.
- A full `npm install` / Vite build / Vitest run could not be completed in the generation environment because the npm registry request failed with a network DNS error. Do not claim those checks passed until they run successfully on the submission machine.
- Before sending the repo, run `npm install`, `npm test`, `npm run build`, `npm run agent`, and `npm run dev`. Check the inspector at a 390px viewport and verify mode/order-type query parameters. Update this note with the actual outcomes.
