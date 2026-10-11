interface CacheDiagnosticsProps {
  hasCache: boolean;
  onCacheChange: (hasCache: boolean) => void;
}

export function CacheDiagnostics({ hasCache, onCacheChange }: CacheDiagnosticsProps) {
  return (
    <section className="panel developer-panel">
      <div>
        <h3>Cache diagnostics</h3>
        <p className="muted">The cache stores the last-known catalog snapshot, not a precomputed menu.</p>
      </div>
      <div className="cache-actions">
        <span className={`cache-indicator ${hasCache ? 'available' : 'missing'}`}>
          {hasCache ? 'Fixture catalog cached' : 'No local catalog cache'}
        </span>
        {hasCache ? (
          <button className="button secondary" type="button" onClick={() => onCacheChange(false)}>Clear cache</button>
        ) : (
          <button className="button secondary" type="button" onClick={() => onCacheChange(true)}>Restore fixture cache</button>
        )}
      </div>
    </section>
  );
}
