import type {
  FixtureSnapshot,
  MenuServer,
  ResolveContext,
  ServerControls,
} from './types';
import { resolveAvailability, resolveLocal } from './resolver';

import { MenuAgentError } from './types';

export function createMenuServerStub(
  serverSnapshot: FixtureSnapshot,
  getControls: () => ServerControls,
): MenuServer {
  async function beforeResponse(): Promise<void> {
    const { fail, delay_ms } = getControls();
    if (delay_ms > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay_ms));
    }
    if (fail) throw new MenuAgentError('Simulated menu server failure', 'SERVER_FAILURE');
  }

  return {
    async resolveAvailability(ctx: ResolveContext) {
      await beforeResponse();
      return resolveAvailability(ctx, serverSnapshot.catalog, serverSnapshot.store);
    },
    async resolveRemote(ctx: ResolveContext) {
      await beforeResponse();
      return resolveLocal(ctx, serverSnapshot.catalog, serverSnapshot.store);
    },
  };
}
