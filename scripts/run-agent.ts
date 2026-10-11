import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseCatalogFixture, parseStoreFixture } from '../src/domain/normalize';
import { resolveLocal } from '../src/domain/resolver';
import type { ResolveContext } from '../src/domain/types';

const here = new URL('../src/fixtures/', import.meta.url);
const read = (name: string) => readFile(fileURLToPath(new URL(name, here)), 'utf8');

const [catalogRaw, storeRaw, contextRaw] = await Promise.all([
  read('catalog.official.json'),
  read('store.json'),
  read('context.preorder.sample.json'),
]);
const catalog = parseCatalogFixture(catalogRaw);
const store = parseStoreFixture(storeRaw);
const context = JSON.parse(contextRaw) as ResolveContext;
const result = resolveLocal(context, catalog, store);

console.log(JSON.stringify({
  store_id: result.catalog.store_id,
  evaluation_time: context.preorder_slot ?? context.now,
  visible: result.visible,
  prices: result.prices,
  oos: result.oos,
}, null, 2));
