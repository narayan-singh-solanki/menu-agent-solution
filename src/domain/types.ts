export type OrderType = 'delivery' | 'collection';
export type TaxClass = 'standard' | 'exempt';

export enum MenuAgentMode {
  Local = 'local',
  Hybrid = 'hybrid',
  Remote = 'remote',
}

export interface Schedule {
  days: string[];
  start: string;
  end: string;
}

export interface Placement {
  price: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  item_ids: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  schedule: Schedule | null;
  stock: number;
  available: boolean;
  tax_class: TaxClass;
  modifier_ids?: string[];
  placements: Partial<Record<OrderType, Placement>>;
}

export interface CatalogModifier {
  id: string;
  name: string;
  price: number;
  external_ref?: string;
}

export interface Catalog {
  store_id: string;
  fetched_at: string;
  categories: Record<string, CatalogCategory>;
  items: Record<string, CatalogItem>;
  modifiers: Record<string, CatalogModifier>;
}

export interface StoreConfig {
  store_id: string;
  timezone: string;
  currency: string;
  menu_agent_mode: MenuAgentMode;
  tax: {
    rate_bp: number;
    inclusive: boolean;
  };
}

export interface ResolveContext {
  store_id: string;
  now: string;
  timezone: string;
  preorder_slot?: string | null;
}

export interface PriceAndTax {
  gross: number;
  tax: number;
}

export type PricesByOrderType = Record<OrderType, Record<string, PriceAndTax>>;
export type VisibleByOrderType = Record<OrderType, string[]>;

export interface CoreResolution {
  catalog: Catalog;
  visible: VisibleByOrderType;
  prices: PricesByOrderType;
  oos: string[];
}

export interface AvailabilityResolution {
  visible: VisibleByOrderType;
  oos: string[];
}

export interface ResolvedMenu extends CoreResolution {
  meta: {
    requested_mode: MenuAgentMode;
    used_mode: MenuAgentMode;
    fallback: boolean;
    evaluated_at: string;
    reason?: string;
  };
}

export interface FixtureSnapshot {
  catalog: Catalog;
  store: StoreConfig;
}

export interface ServerControls {
  fail: boolean;
  delay_ms: number;
}

export interface MenuServer {
  resolveAvailability(ctx: ResolveContext): Promise<AvailabilityResolution>;
  resolveRemote(ctx: ResolveContext): Promise<CoreResolution>;
}

export class MenuAgentError extends Error {
  readonly code: 'NO_CACHE' | 'SERVER_FAILURE' | 'TIMEOUT' | 'INVALID_CONTEXT';

  constructor(
    message: string,
    code: MenuAgentError['code'],
  ) {
    super(message);
    this.name = 'MenuAgentError';
    this.code = code;
  }
}

export interface ResolveMenuOptions {
  mode: MenuAgentMode;
  context: ResolveContext;
  cache: FixtureSnapshot | null;
  server: MenuServer;
  timeoutMs?: number;
}