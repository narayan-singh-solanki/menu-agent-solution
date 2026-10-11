import catalogText from './fixtures/catalog.official.json?raw';
import rawStore from './fixtures/store.json';
import sampleContextFixture from './fixtures/context.sample.json';
import preorderContextFixture from './fixtures/context.preorder.sample.json';
import { parseCatalogFixture, parseStoreFixture } from './domain/normalize';
import type { FixtureSnapshot, ResolveContext, StoreConfig } from './domain/types';

const catalog = parseCatalogFixture(catalogText);
const store: StoreConfig = parseStoreFixture(JSON.stringify(rawStore));

export const fixtureSnapshot: FixtureSnapshot = { catalog, store };

export const sampleContext: ResolveContext = {
  store_id: sampleContextFixture.store_id,
  now: sampleContextFixture.now,
  timezone: sampleContextFixture.timezone,
  preorder_slot: null,
};

export const preorderSampleContext: ResolveContext = {
  store_id: preorderContextFixture.store_id,
  now: preorderContextFixture.now,
  timezone: preorderContextFixture.timezone,
  preorder_slot: preorderContextFixture.preorder_slot,
};
