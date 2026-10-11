import type { MenuAgentMode, OrderType } from '../domain/types';

interface ResolutionControlsProps {
  mode: MenuAgentMode;
  orderType: OrderType;
  nowInput: string;
  preorderEnabled: boolean;
  preorderInput: string;
  serverFail: boolean;
  delayMs: number;
  onModeChange: (value: MenuAgentMode) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onNowChange: (value: string) => void;
  onPreorderEnabledChange: (value: boolean) => void;
  onPreorderChange: (value: string) => void;
  onServerFailChange: (value: boolean) => void;
  onDelayChange: (value: number) => void;
  onReset: () => void;
}

export function ResolutionControls({
  mode,
  orderType,
  nowInput,
  preorderEnabled,
  preorderInput,
  serverFail,
  delayMs,
  onModeChange,
  onOrderTypeChange,
  onNowChange,
  onPreorderEnabledChange,
  onPreorderChange,
  onServerFailChange,
  onDelayChange,
  onReset,
}: ResolutionControlsProps) {
  return (
    <section className="panel controls-panel" aria-label="Menu resolver controls">
      <div className="panel-heading">
        <div>
          <h2>Resolution controls</h2>
          <p>Times below are interpreted in the store’s timezone.</p>
        </div>
        <button className="button secondary" type="button" onClick={onReset}>Reset demo</button>
      </div>

      <div className="control-grid">
        <label className="field">
          <span>Agent mode</span>
          <select value={mode} onChange={(event) => onModeChange(event.target.value as MenuAgentMode)}>
            <option value="local">Local — client rules</option>
            <option value="hybrid">Hybrid — server schedule/stock</option>
            <option value="remote">Remote — server rules</option>
          </select>
        </label>
        <label className="field">
          <span>Order type</span>
          <select value={orderType} onChange={(event) => onOrderTypeChange(event.target.value as OrderType)}>
            <option value="delivery">Delivery</option>
            <option value="collection">Collection</option>
          </select>
        </label>
        <label className="field field-wide">
          <span>Evaluation time · Sydney</span>
          <input type="datetime-local" value={nowInput} onChange={(event) => onNowChange(event.target.value)} />
        </label>
        <label className="checkbox-field field-wide">
          <input type="checkbox" checked={preorderEnabled} onChange={(event) => onPreorderEnabledChange(event.target.checked)} />
          <span>Evaluate schedule at a preorder slot instead of the current time</span>
        </label>
        {preorderEnabled && (
          <label className="field field-wide">
            <span>Preorder slot · Sydney</span>
            <input type="datetime-local" value={preorderInput} onChange={(event) => onPreorderChange(event.target.value)} />
          </label>
        )}
      </div>

      <div className="simulator-row">
        <div className="simulator-copy">
          <strong>Server simulation</strong>
          <span className="muted">Only applies to hybrid and remote.</span>
        </div>
        <label className="checkbox-field compact">
          <input type="checkbox" checked={serverFail} onChange={(event) => onServerFailChange(event.target.checked)} />
          <span>Force failure</span>
        </label>
        <label className="field delay-field">
          <span>Response delay</span>
          <select value={delayMs} onChange={(event) => onDelayChange(Number(event.target.value))}>
            <option value={0}>None</option>
            <option value={1500}>1.5 seconds</option>
            <option value={3500}>3.5 seconds (over budget)</option>
          </select>
        </label>
      </div>
    </section>
  );
}
