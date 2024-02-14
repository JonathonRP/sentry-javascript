import type { Context, ContextManager } from '@opentelemetry/api';
import { Hub } from '@sentry/core';
import { getCurrentHub } from '@sentry/core';
import type { Hub as HubInterface } from '@sentry/types';
import { SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY } from './constants';

import { setHubOnContext } from './utils/contextData';

function createNewHub(parent: HubInterface | undefined, shouldForkIsolationScope: boolean): Hub {
  if (parent) {
    // eslint-disable-next-line deprecation/deprecation
    const client = parent.getClient();
    // eslint-disable-next-line deprecation/deprecation
    const scope = parent.getScope();
    // eslint-disable-next-line deprecation/deprecation
    const isolationScope = parent.getIsolationScope();

    // eslint-disable-next-line deprecation/deprecation
    return new Hub(client, scope.clone(), shouldForkIsolationScope ? isolationScope.clone() : isolationScope);
  }

  // eslint-disable-next-line deprecation/deprecation
  return new Hub();
}

// Typescript complains if we do not use `...args: any[]` for the mixin, with:
// A mixin class must have a constructor with a single rest parameter of type 'any[]'.ts(2545)
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Wrap an OpenTelemetry ContextManager in a way that ensures the context is kept in sync with the Sentry Hub.
 *
 * Usage:
 * import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
 * const SentryContextManager = wrapContextManagerClass(AsyncLocalStorageContextManager);
 * const contextManager = new SentryContextManager();
 */
export function wrapContextManagerClass<ContextManagerInstance extends ContextManager>(
  ContextManagerClass: new (...args: any[]) => ContextManagerInstance,
): typeof ContextManagerClass {
  /**
   * This is a custom ContextManager for OpenTelemetry, which extends the default AsyncLocalStorageContextManager.
   * It ensures that we create a new hub per context, so that the OTEL Context & the Sentry Hub are always in sync.
   *
   * Note that we currently only support AsyncHooks with this,
   * but since this should work for Node 14+ anyhow that should be good enough.
   */

  // @ts-expect-error TS does not like this, but we know this is fine
  class SentryContextManager extends ContextManagerClass {
    /**
     * Overwrite with() of the original AsyncLocalStorageContextManager
     * to ensure we also create a new hub per context.
     */
    public with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
      context: Context,
      fn: F,
      thisArg?: ThisParameterType<F>,
      ...args: A
    ): ReturnType<F> {
      const shouldForkIsolationScope = context.getValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY) === true;

      // eslint-disable-next-line deprecation/deprecation
      const existingHub = getCurrentHub();
      const newHub = createNewHub(existingHub, shouldForkIsolationScope);

      return super.with(
        setHubOnContext(context.deleteValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY), newHub),
        fn,
        thisArg,
        ...args,
      );
    }
  }

  return SentryContextManager as unknown as typeof ContextManagerClass;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
