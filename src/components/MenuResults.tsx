import type { OrderType, ResolvedMenu } from '../domain/types';

type RequestState = 'loading' | 'ready' | 'error';

interface MenuResultsProps {
  result: ResolvedMenu | null;
  requestState: RequestState;
  errorMessage: string;
  hasCache: boolean;
  orderType: OrderType;
  currency: string;
  search: string;
  onSearchChange: (value: string) => void;
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100);
}

export function MenuResults({
  result,
  requestState,
  errorMessage,
  hasCache,
  orderType,
  currency,
  search,
  onSearchChange,
}: MenuResultsProps) {
  const visibleIds = result?.visible[orderType] ?? [];
  const searchTerm = search.trim().toLowerCase();
  const filteredIds = visibleIds.filter((id) => {
    const name = result?.catalog.items[id]?.name ?? '';
    return name.toLowerCase().includes(searchTerm);
  });
  const categorySections = result
    ? Object.values(result.catalog.categories)
        .map((category) => ({
          ...category,
          item_ids: category.item_ids.filter((id) => filteredIds.includes(id)),
        }))
        .filter((category) => category.item_ids.length > 0)
    : [];

  return (
    <>
      <section className="result-header">
        <div>
          <p className="eyebrow">RESOLVED MENU</p>
          <h2>{orderType === 'delivery' ? 'Delivery menu' : 'Collection menu'}</h2>
          <p className="muted">{visibleIds.length} sellable items · prices in {currency}</p>
        </div>
        <div className="status-area" aria-live="polite">
          {requestState === 'loading' && <span className="status-pill pending"><span className="spinner" /> Resolving…</span>}
          {requestState === 'ready' && result && (
            <span className={`status-pill ${result.meta.fallback ? 'warning' : 'success'}`}>
              {result.meta.fallback ? 'Local fallback used' : `${result.meta.used_mode} result`}
            </span>
          )}
          {requestState === 'error' && <span className="status-pill danger">Error · no menu returned</span>}
        </div>
      </section>

      {requestState === 'error' && (
        <section className="panel error-panel" role="alert">
          <strong>Menu unavailable</strong>
          <p>{errorMessage}</p>
          {!hasCache && <p className="muted">There is no cached catalog. Restore the fixture cache to recover locally.</p>}
        </section>
      )}

      {result && requestState === 'ready' && (
        <>
          <section className="panel resolution-panel">
            <div className="resolution-metrics">
              <div><span>Requested mode</span><strong>{result.meta.requested_mode}</strong></div>
              <div><span>Mode used</span><strong>{result.meta.used_mode}</strong></div>
              <div><span>Fallback</span><strong>{result.meta.fallback ? 'Yes' : 'No'}</strong></div>
              <div><span>Out of stock</span><strong>{result.oos.length}</strong></div>
            </div>
            <p className="evaluated-line">Evaluated at: <code>{result.meta.evaluated_at}</code></p>
            <p className="oos-ids-line">OOS IDs: <code>{result.oos.length ? result.oos.join(', ') : 'None'}</code></p>
            {result.meta.fallback && (
              <p className="fallback-reason">
                Server response was not usable: {result.meta.reason}. Menu recomputed locally from the cached catalog.
              </p>
            )}
          </section>

          <section className="menu-panel">
            <div className="menu-toolbar">
              <div>
                <h3>Visible items</h3>
                <p className="muted">Search is applied in the inspector, after the agent resolves the menu.</p>
              </div>
              <label className="search-field">
                <span className="sr-only">Search visible items</span>
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search menu" />
              </label>
            </div>

            {categorySections.length === 0 ? (
              <div className="empty-state">No visible items match this selection.</div>
            ) : categorySections.map((category) => (
              <div className="category-section" key={category.id}>
                <h4>{category.name}</h4>
                <div className="item-list">
                  {category.item_ids.map((id) => {
                    const item = result.catalog.items[id];
                    const price = result.prices[orderType][id];
                    if (!item || !price) return null;

                    return (
                      <article className="menu-item" key={`${category.id}:${id}`}>
                        <div className="item-information">
                          <strong>{item.name}</strong>
                          <span className="item-meta">ID: {id} · Tax class: {item.tax_class}</span>
                        </div>
                        <div className="item-pricing">
                          <strong>{formatMoney(price.gross, currency)}</strong>
                          <span>Tax {formatMoney(price.tax, currency)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
