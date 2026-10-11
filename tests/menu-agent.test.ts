import { describe, expect, it } from 'vitest';
import { resolveMenu } from '../src/domain/agent';
import { calculatePriceAndTax, roundRatioHalfUp } from '../src/domain/pricing';
import { resolveLocal } from '../src/domain/resolver';
import { createMenuServerStub } from '../src/domain/serverStub';
import { MenuAgentMode, type MenuServer, type ResolveContext, type StoreConfig } from '../src/domain/types';
import { fixtureSnapshot, preorderSampleContext, sampleContext } from '../src/fixtures';

const { catalog, store } = fixtureSnapshot;

function contextAt(now: string, preorder_slot: string | null = null): ResolveContext {
  return { store_id: 's1', now, timezone: 'Australia/Sydney', preorder_slot };
}

describe('fixture normalization', () => {
  it('preserves the exact large modifier external reference', () => {
    expect(catalog.modifiers.mod_patty.external_ref).toBe('9007199254740993');
  });

  it('recomputes vendor-visible IDs instead of trusting the dump snapshot', () => {
    const result = resolveLocal(sampleContext, catalog, store);
    expect(result.visible.delivery).not.toContain('item_soldout');
    expect(result.visible.delivery).not.toContain('item_lunch');
  });
});

describe('schedule and availability', () => {
  it('evaluates schedule in the context/store timezone and excludes zero stock', () => {
    const result = resolveLocal(sampleContext, catalog, store);
    expect(result.visible.delivery).toEqual(['item_burger', 'item_water']);
    expect(result.visible.collection).toEqual(['item_burger', 'item_water']);
    expect(result.oos).toEqual(['item_soldout']);
  });

  it('uses the preorder slot instead of now when one is supplied', () => {
    const result = resolveLocal(preorderSampleContext, catalog, store);
    expect(result.visible.delivery).toContain('item_lunch');
    expect(result.visible.collection).toContain('item_lunch');
    expect(result.catalog.items.item_lunch.name).toBe('Lunch bowl');
  });

  it('includes the start boundary and excludes the end boundary', () => {
    const atStart = resolveLocal(contextAt('2026-10-06T00:00:00Z'), catalog, store); // 11:00 in Sydney
    const atEnd = resolveLocal(contextAt('2026-10-06T03:30:00Z'), catalog, store); // 14:30 in Sydney
    expect(atStart.visible.delivery).toContain('item_lunch');
    expect(atEnd.visible.delivery).not.toContain('item_lunch');
  });

  it('recomputes using the new context rather than reusing a cached menu', () => {
    const afterHours = resolveLocal(sampleContext, catalog, store);
    const lunchtime = resolveLocal(preorderSampleContext, catalog, store);
    expect(afterHours.visible.delivery).not.toContain('item_lunch');
    expect(lunchtime.visible.delivery).toContain('item_lunch');
  });
});

describe('order-specific pricing and tax', () => {
  const lunchtime = resolveLocal(preorderSampleContext, catalog, store);

  it('uses the separate delivery and collection price placements', () => {
    expect(lunchtime.prices.delivery.item_burger.gross).toBe(1299);
    expect(lunchtime.prices.collection.item_burger.gross).toBe(1099);
  });

  it('treats the store price as tax-inclusive and rounds tax to whole cents', () => {
    expect(lunchtime.prices.delivery.item_lunch).toEqual({ gross: 1450, tax: 132 });
    expect(lunchtime.prices.delivery.item_burger).toEqual({ gross: 1299, tax: 118 });
    expect(lunchtime.prices.collection.item_burger).toEqual({ gross: 1099, tax: 100 });
  });

  it('keeps exempt items tax-free', () => {
    expect(lunchtime.prices.delivery.item_water).toEqual({ gross: 300, tax: 0 });
  });

  it('implements half-up rounding (including an exact half-cent case)', () => {
    expect(roundRatioHalfUp(1, 2)).toBe(1);
    expect(roundRatioHalfUp(3, 2)).toBe(2);
    const exclusiveStore: StoreConfig = { ...store, tax: { rate_bp: 1000, inclusive: false } };
    expect(calculatePriceAndTax(5, 'standard', exclusiveStore)).toEqual({ gross: 6, tax: 1 });
  });
});

describe('mode routing and failure fallback', () => {
  it('uses a server availability result in hybrid mode but calculates prices with client rules', async () => {
    const server = createMenuServerStub(fixtureSnapshot, () => ({ fail: false, delay_ms: 0 }));
    const result = await resolveMenu({ mode: MenuAgentMode.Hybrid, context: preorderSampleContext, cache: fixtureSnapshot, server });
    expect(result.meta.used_mode).toBe('hybrid');
    expect(result.meta.fallback).toBe(false);
    expect(result.prices.delivery.item_lunch).toEqual({ gross: 1450, tax: 132 });
  });

  it('uses server pricing in remote mode when the server responds', async () => {
    const server = createMenuServerStub(fixtureSnapshot, () => ({ fail: false, delay_ms: 0 }));
    const result = await resolveMenu({ mode: MenuAgentMode.Remote, context: preorderSampleContext, cache: fixtureSnapshot, server });
    expect(result.meta.used_mode).toBe('remote');
    expect(result.meta.fallback).toBe(false);
    expect(result.visible.delivery).toContain('item_lunch');
  });

  it('falls back after the single 3-second total server budget', async () => {
    const slowServer = createMenuServerStub(fixtureSnapshot, () => ({ fail: false, delay_ms: 3_500 }));
    const startedAt = Date.now();
    const result = await resolveMenu({ mode: MenuAgentMode.Remote, context: sampleContext, cache: fixtureSnapshot, server: slowServer });
    const elapsed = Date.now() - startedAt;
    expect(result.meta.fallback).toBe(true);
    expect(result.meta.used_mode).toBe('local');
    expect(result.visible.delivery).not.toContain('item_lunch');
    expect(elapsed).toBeGreaterThanOrEqual(2_900);
    expect(elapsed).toBeLessThan(3_500);
  }, 6_000);

  it('returns an error rather than an empty menu when the server fails and no cache exists', async () => {
    const failedServer: MenuServer = {
      async resolveAvailability() { throw new Error('offline'); },
      async resolveRemote() { throw new Error('offline'); },
    };
    await expect(resolveMenu({ mode: MenuAgentMode.Remote, context: sampleContext, cache: null, server: failedServer }))
      .rejects.toMatchObject({ code: 'NO_CACHE' });
  });
});
