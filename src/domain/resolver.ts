import type {
  AvailabilityResolution,
  Catalog,
  CoreResolution,
  OrderType,
  PricesByOrderType,
  ResolveContext,
  StoreConfig,
  VisibleByOrderType,
} from './types';

import { calculatePriceAndTax } from './pricing';
import { isWithinSchedule } from './time';

const ORDER_TYPES: OrderType[] = ['delivery', 'collection'];

function validateContext(ctx: ResolveContext, store: StoreConfig, catalog: Catalog): void {
  if (ctx.store_id !== store.store_id || ctx.store_id !== catalog.store_id) {
    throw new Error("Data mismatch: Context, Store, and Catalog must have the same store_id.");
  }

  if (isNaN(Date.parse(ctx.now))) {
    throw new Error("Context requires a valid 'now' timestamp.");
  }
  
  if (ctx.preorder_slot && isNaN(Date.parse(ctx.preorder_slot))) {
    throw new Error("The provided preorder_slot is not a valid timestamp.");
  }

  if (!ctx.timezone) {
    throw new Error("Context timezone is required.");
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: ctx.timezone });
  } catch (error) {
    throw new Error(`The timezone '${ctx.timezone}' is not a valid IANA timezone.`);
  }
}

export function resolveAvailability(
  ctx: ResolveContext,
  catalog: Catalog,
  store: StoreConfig,
): AvailabilityResolution {
  validateContext(ctx, store, catalog);
  const visible: VisibleByOrderType = { delivery: [], collection: [] };
  const oos: string[] = [];

  for (const [itemId, item] of Object.entries(catalog.items)) {
    if (item.available !== true || item.stock <= 0) {
      oos.push(itemId);
      continue;
    }
    if (!isWithinSchedule(item.schedule, ctx)) continue;

    for (const orderType of ORDER_TYPES) {
      if (item.placements[orderType]) visible[orderType].push(itemId);
    }
  }

  return { visible, oos: oos.sort() };
}

export function calculateClientPrices(
  visible: VisibleByOrderType,
  catalog: Catalog,
  store: StoreConfig,
): PricesByOrderType {
  const prices: PricesByOrderType = { delivery: {}, collection: {} };
  for (const orderType of ORDER_TYPES) {
    for (const itemId of visible[orderType]) {
      const item = catalog.items[itemId];
      const placement = item?.placements[orderType];
      if (!item || !placement) continue;
      prices[orderType][itemId] = calculatePriceAndTax(placement.price, item.tax_class, store);
    }
  }
  return prices;
}

export function resolveLocal(
  ctx: ResolveContext,
  catalog: Catalog,
  store: StoreConfig,
): CoreResolution {
  const availability = resolveAvailability(ctx, catalog, store);
  return {
    catalog,
    visible: availability.visible,
    prices: calculateClientPrices(availability.visible, catalog, store),
    oos: availability.oos,
  };
}
