import type {
  Catalog,
  CatalogCategory,
  CatalogItem,
  CatalogModifier,
  StoreConfig,
} from './types';

export function parseCatalogFixture(rawText: string): Catalog {
  const exactIdentifiers = rawText.replace(
    /("external_ref"\s*:\s*)(\d+)/g,
    '$1"$2"',
  );
  const parsed = JSON.parse(exactIdentifiers) as {
    store_id: string;
    fetched_at: string;
    categories: CatalogCategory[];
    items: Record<string, CatalogItem>;
    modifiers: Record<string, Omit<CatalogModifier, 'external_ref'> & { external_ref?: string | number }>;
  };

  const categories = Object.fromEntries(
    parsed.categories.map((category) => [category.id, category]),
  );
  const modifiers = Object.fromEntries(
    Object.entries(parsed.modifiers).map(([id, modifier]) => [
      id,
      {
        ...modifier,
        ...(modifier.external_ref === undefined
          ? {}
          : { external_ref: String(modifier.external_ref) }),
      },
    ]),
  ) as Record<string, CatalogModifier>;

  return {
    store_id: parsed.store_id,
    fetched_at: parsed.fetched_at,
    categories: categories as Record<string, CatalogCategory>,
    items: parsed.items,
    modifiers,
  };
}

export function parseStoreFixture(rawText: string): StoreConfig {
  return JSON.parse(rawText) as StoreConfig;
}
