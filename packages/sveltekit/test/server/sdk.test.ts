import * as SentryNode from '@sentry/node';
import type { NodeClient } from '@sentry/node';
import { SDK_VERSION, getClient } from '@sentry/node';
import { GLOBAL_OBJ } from '@sentry/utils';

import { init } from '../../src/server/sdk';

const nodeInit = vi.spyOn(SentryNode, 'init');

describe('Sentry server SDK', () => {
  describe('init', () => {
    afterEach(() => {
      vi.clearAllMocks();
      GLOBAL_OBJ.__SENTRY__.hub = undefined;
    });

    it('adds SvelteKit metadata to the SDK options', () => {
      expect(nodeInit).not.toHaveBeenCalled();

      init({});

      expect(nodeInit).toHaveBeenCalledTimes(1);
      expect(nodeInit).toHaveBeenCalledWith(
        expect.objectContaining({
          _metadata: {
            sdk: {
              name: 'sentry.javascript.sveltekit',
              version: SDK_VERSION,
              packages: [
                { name: 'npm:@sentry/sveltekit', version: SDK_VERSION },
                { name: 'npm:@sentry/node', version: SDK_VERSION },
              ],
            },
          },
        }),
      );
    });

    it('sets the runtime tag on the scope', () => {
      const currentScope = SentryNode.getCurrentScope();

      // @ts-expect-error need access to protected _tags attribute
      expect(currentScope._tags).toEqual({});

      init({ dsn: 'https://public@dsn.ingest.sentry.io/1337' });

      // @ts-expect-error need access to protected _tags attribute
      expect(currentScope._tags).toEqual({ runtime: 'node' });
    });

    it('adds rewriteFramesIntegration by default', () => {
      init({
        dsn: 'https://public@dsn.ingest.sentry.io/1337',
      });

      const rewriteFramesIntegration = getClient<NodeClient>()?.getIntegrationByName('RewriteFrames');
      expect(rewriteFramesIntegration).toBeDefined();
    });
  });
});
