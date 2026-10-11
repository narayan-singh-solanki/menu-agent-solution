# Agent instructions

- Treat `src/fixtures/` as the only domain-data source. Do not invent live vendor data or call third-party services.
- Before changing behavior, check the assignment brief and fixture fields. The fixtures override the working notes.
- Keep business rules in `src/domain/`; keep inspector state, search, display formatting, and URL parameters in the UI.
- Keep prices as integer minor units until formatting at the UI boundary. Use integer half-up rounding for tax.
- Evaluate schedules in the context's IANA timezone; if `preorder_slot` is set, evaluate the schedule at that instant.
- Treat catalog-provided `visible` IDs as stale input, not final output. Recompute from schedule, stock, availability, and order-type placement.
- Enforce one 3-second total budget for each server call. Do not retry before fallback. On failure/timeout, recompute locally from the last cached catalog and current request context; do not return an empty menu when a cache exists.
- Run `npm test` and `npm run build` after domain changes. If a check cannot be run, say so explicitly.
- Preserve opaque vendor identifiers exactly; do not store integers beyond JavaScript's safe range as `number`.
- Update `docs/CONFLICTS.md`, `docs/FIELD-MAPPING.md`, and `AI-NOTES.md` when decisions or verification change.
