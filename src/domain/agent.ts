import type {
  CoreResolution,
  FixtureSnapshot,
  ResolveContext,
  ResolveMenuOptions,
  ResolvedMenu,
} from './types';
import { MenuAgentError, MenuAgentMode } from './types';
import { calculateClientPrices, resolveLocal } from './resolver';

const SERVER_BUDGET_MS = 3_000;

async function withServerBudget<T>(operation: Promise<T>, budgetMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new MenuAgentError(`Menu server exceeded ${budgetMs}ms budget`, 'TIMEOUT')),
      budgetMs,
    );
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function withMeta(
  core: CoreResolution,
  requestedMode: MenuAgentMode,
  usedMode: MenuAgentMode,
  ctx: ResolveContext,
  fallback: boolean,
  reason?: string,
): ResolvedMenu {
  return {
    ...core,
    meta: {
      requested_mode: requestedMode,
      used_mode: usedMode,
      fallback,
      evaluated_at: ctx.preorder_slot || ctx.now,
      ...(reason ? { reason } : {}),
    },
  };
}

function localOrNoCache(
  ctx: ResolveContext,
  cache: FixtureSnapshot | null,
  requestedMode: MenuAgentMode,
  reason: string,
): ResolvedMenu {
  if (!cache) {
    throw new MenuAgentError(
      `The menu server failed and no cached catalog is available. (${reason})`,
      'NO_CACHE',
    );
  }
  return withMeta(resolveLocal(ctx, cache.catalog, cache.store), requestedMode, MenuAgentMode.Local, ctx, true, reason);
}

export async function resolveMenu(options: ResolveMenuOptions): Promise<ResolvedMenu> {
  const { mode, context: ctx, cache, server } = options;
  const timeoutMs = options.timeoutMs ?? SERVER_BUDGET_MS;

  const buildMeta = (usedMode: MenuAgentMode, isFallback: boolean, reason?: string) => ({
    requested_mode: mode,
    used_mode: usedMode,
    fallback: isFallback,
    evaluated_at: ctx.preorder_slot || ctx.now,
    ...(reason ? { reason } : {})
  });

  try {
    switch(mode) {
      case MenuAgentMode.Local:
        if (!cache) {
          throw new MenuAgentError('No cached catalog is available for local mode.', 'NO_CACHE');
        }
        return {
          ...resolveLocal(ctx, cache.catalog, cache.store),
          meta: buildMeta(MenuAgentMode.Local, false)
        };
      case MenuAgentMode.Hybrid:
        if (!cache) throw new MenuAgentError('Hybrid mode needs a cached client catalog for pricing.', 'NO_CACHE');
        const availability = await withServerBudget(server.resolveAvailability(ctx), timeoutMs);
        const prices = calculateClientPrices(availability.visible, cache.catalog, cache.store);
        for (const orderType of ['delivery', 'collection'] as const) {
          if (availability.visible[orderType].some((id) => !prices[orderType][id])) {
            throw new Error(`Cached catalog cannot price every ${orderType} item returned by the server`);
          }
        }
        return {
          catalog: cache.catalog,
          visible: availability.visible,
          prices,
          oos: availability.oos,
          meta: buildMeta(MenuAgentMode.Hybrid, false)
        };
      case MenuAgentMode.Remote:
        const result = await withServerBudget(server.resolveRemote(ctx), timeoutMs);
        return withMeta(result, mode, MenuAgentMode.Remote, ctx, false);
      default:
        throw new Error(`Unknown mode requested: ${mode}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!cache) {
      throw new MenuAgentError(
        `Menu unavailable: server request failed and no local catalog cache exists. (${message})`,
        'NO_CACHE',
      );
    }
    return localOrNoCache(ctx, cache, mode, message);
  }
}
