import type { OrderType, ResolveContext, ResolvedMenu, ServerControls } from './domain/types';
import { fixtureSnapshot, preorderSampleContext, sampleContext } from './fixtures';
import { isoToLocalInput, localInputToIso } from './domain/localTimeInput';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CacheDiagnostics } from './components/CacheDiagnostics';
import { MenuAgentMode } from './domain/types';
import { MenuResults } from './components/MenuResults';
import { ResolutionControls } from './components/ResolutionControls';
import { createMenuServerStub } from './domain/serverStub';
import { resolveMenu } from './domain/agent';

const MODES: MenuAgentMode[] = [MenuAgentMode.Local, MenuAgentMode.Hybrid, MenuAgentMode.Remote];
const ORDER_TYPES: OrderType[] = ['delivery', 'collection'];
const TIME_ZONE = fixtureSnapshot.store.timezone;

type RequestState = 'loading' | 'ready' | 'error';

function initialMode(): MenuAgentMode {
  const value = new URLSearchParams(window.location.search).get('mode');
  return MODES.includes(value as MenuAgentMode) ? value as MenuAgentMode : fixtureSnapshot.store.menu_agent_mode;
}

function initialOrderType(): OrderType {
  const value = new URLSearchParams(window.location.search).get('orderType');
  return ORDER_TYPES.includes(value as OrderType) ? value as OrderType : 'delivery';
}

function buildContext(nowInput: string, preorderEnabled: boolean, preorderInput: string): ResolveContext {
  return {
    store_id: fixtureSnapshot.store.store_id,
    now: localInputToIso(nowInput, TIME_ZONE),
    timezone: TIME_ZONE,
    preorder_slot: preorderEnabled ? localInputToIso(preorderInput, TIME_ZONE) : null,
  };
}

export default function App() {
  const [mode, setMode] = useState<MenuAgentMode>(initialMode);
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [nowInput, setNowInput] = useState(() => isoToLocalInput(sampleContext.now, TIME_ZONE));
  const [preorderEnabled, setPreorderEnabled] = useState(false);
  const [preorderInput, setPreorderInput] = useState(() =>
    isoToLocalInput(preorderSampleContext.preorder_slot ?? sampleContext.now, TIME_ZONE),
  );
  const [serverFail, setServerFail] = useState(false);
  const [delayMs, setDelayMs] = useState(0);
  const [hasCache, setHasCache] = useState(true);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<ResolvedMenu | null>(null);
  const [requestState, setRequestState] = useState<RequestState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const requestId = useRef(0);
  const controlsRef = useRef<ServerControls>({ fail: false, delay_ms: 0 });
  controlsRef.current = { fail: serverFail, delay_ms: delayMs };
  const server = useMemo(
    () => createMenuServerStub(fixtureSnapshot, () => controlsRef.current),
    [],
  );
  const clientCache = hasCache ? fixtureSnapshot : null;

  useEffect(() => {
    const current = new URL(window.location.href);
    current.searchParams.set('mode', mode);
    current.searchParams.set('orderType', orderType);
    window.history.replaceState({}, '', current);
  }, [mode, orderType]);

  useEffect(() => {
    const id = ++requestId.current;
    setRequestState('loading');
    setErrorMessage('');

    let context: ResolveContext;
    try {
      context = buildContext(nowInput, preorderEnabled, preorderInput);
    } catch (error) {
      setResult(null);
      setRequestState('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
      return;
    }

    void resolveMenu({ mode, context, cache: clientCache, server })
      .then((nextResult) => {
        if (requestId.current !== id) return;
        setResult(nextResult);
        setRequestState('ready');
      })
      .catch((error: unknown) => {
        if (requestId.current !== id) return;
        setResult(null);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setRequestState('error');
      });
  }, [mode, nowInput, preorderEnabled, preorderInput, serverFail, delayMs, hasCache, clientCache, server]);

  function resetDemo() {
    setNowInput(isoToLocalInput(sampleContext.now, TIME_ZONE));
    setPreorderEnabled(false);
    setPreorderInput(isoToLocalInput(preorderSampleContext.preorder_slot ?? sampleContext.now, TIME_ZONE));
    setMode(fixtureSnapshot.store.menu_agent_mode);
    setOrderType('delivery');
    setServerFail(false);
    setDelayMs(0);
    setSearch('');
    setHasCache(true);
  }

  const currency = fixtureSnapshot.store.currency;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">MENU AGENT · INSPECTOR</p>
          <h1>One menu. Consistent everywhere.</h1>
          <p className="intro">Inspect the same schedule, stock, price and tax rules across local, hybrid and remote modes.</p>
        </div>
        <div className="store-chip">
          <span className="store-dot" />
          <span>{fixtureSnapshot.store.store_id}</span>
          <span className="muted">· {TIME_ZONE}</span>
        </div>
      </header>

      <ResolutionControls
        mode={mode}
        orderType={orderType}
        nowInput={nowInput}
        preorderEnabled={preorderEnabled}
        preorderInput={preorderInput}
        serverFail={serverFail}
        delayMs={delayMs}
        onModeChange={setMode}
        onOrderTypeChange={setOrderType}
        onNowChange={setNowInput}
        onPreorderEnabledChange={setPreorderEnabled}
        onPreorderChange={setPreorderInput}
        onServerFailChange={setServerFail}
        onDelayChange={setDelayMs}
        onReset={resetDemo}
      />

      <MenuResults
        result={result}
        requestState={requestState}
        errorMessage={errorMessage}
        hasCache={hasCache}
        orderType={orderType}
        currency={currency}
        search={search}
        onSearchChange={setSearch}
      />

      <CacheDiagnostics hasCache={hasCache} onCacheChange={setHasCache} />

      <footer className="page-footer">
        <span>Store currency: {currency}</span>
        <span>Tax rate: {fixtureSnapshot.store.tax.rate_bp / 100}% · {fixtureSnapshot.store.tax.inclusive ? 'tax inclusive' : 'tax exclusive'}</span>
      </footer>
    </main>
  );
}
