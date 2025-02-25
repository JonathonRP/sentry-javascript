import type { ServerRuntimeClient } from '@sentry/core';
import { convertIntegrationFnToClass } from '@sentry/core';
import { captureEvent } from '@sentry/core';
import { getClient } from '@sentry/core';
import { flush } from '@sentry/core';
import type {
  Client,
  Event,
  Integration,
  IntegrationClass,
  IntegrationFn,
  Primitive,
  StackParser,
} from '@sentry/types';
import { eventFromUnknownInput, isPrimitive } from '@sentry/utils';

type GlobalHandlersIntegrationsOptionKeys = 'error' | 'unhandledrejection';

type GlobalHandlersIntegrations = Record<GlobalHandlersIntegrationsOptionKeys, boolean>;

const INTEGRATION_NAME = 'GlobalHandlers';
let isExiting = false;

const globalHandlersIntegration = ((options?: GlobalHandlersIntegrations) => {
  const _options = {
    error: true,
    unhandledrejection: true,
    ...options,
  };

  return {
    name: INTEGRATION_NAME,
    // TODO v8: Remove this
    setupOnce() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    setup(client) {
      if (_options.error) {
        installGlobalErrorHandler(client);
      }
      if (_options.unhandledrejection) {
        installGlobalUnhandledRejectionHandler(client);
      }
    },
  };
}) satisfies IntegrationFn;

/** Global handlers */
// eslint-disable-next-line deprecation/deprecation
export const GlobalHandlers = convertIntegrationFnToClass(
  INTEGRATION_NAME,
  globalHandlersIntegration,
) as IntegrationClass<Integration & { setup: (client: Client) => void }>;

function installGlobalErrorHandler(client: Client): void {
  globalThis.addEventListener('error', data => {
    if (getClient() !== client || isExiting) {
      return;
    }

    const stackParser = getStackParser();

    const { message, error } = data;

    const event = eventFromUnknownInput(getClient(), stackParser, error || message);

    event.level = 'fatal';

    captureEvent(event, {
      originalException: error,
      mechanism: {
        handled: false,
        type: 'error',
      },
    });

    // Stop the app from exiting for now
    data.preventDefault();
    isExiting = true;

    flush().then(
      () => {
        // rethrow to replicate Deno default behavior
        throw error;
      },
      () => {
        // rethrow to replicate Deno default behavior
        throw error;
      },
    );
  });
}

function installGlobalUnhandledRejectionHandler(client: Client): void {
  globalThis.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    if (getClient() !== client || isExiting) {
      return;
    }

    const stackParser = getStackParser();
    let error = e;

    // dig the object of the rejection out of known event types
    try {
      if ('reason' in e) {
        error = e.reason;
      }
    } catch (_oO) {
      // no-empty
    }

    const event = isPrimitive(error)
      ? eventFromRejectionWithPrimitive(error)
      : eventFromUnknownInput(getClient(), stackParser, error, undefined);

    event.level = 'fatal';

    captureEvent(event, {
      originalException: error,
      mechanism: {
        handled: false,
        type: 'unhandledrejection',
      },
    });

    // Stop the app from exiting for now
    e.preventDefault();
    isExiting = true;

    flush().then(
      () => {
        // rethrow to replicate Deno default behavior
        throw error;
      },
      () => {
        // rethrow to replicate Deno default behavior
        throw error;
      },
    );
  });
}

/**
 * Create an event from a promise rejection where the `reason` is a primitive.
 *
 * @param reason: The `reason` property of the promise rejection
 * @returns An Event object with an appropriate `exception` value
 */
function eventFromRejectionWithPrimitive(reason: Primitive): Event {
  return {
    exception: {
      values: [
        {
          type: 'UnhandledRejection',
          // String() is needed because the Primitive type includes symbols (which can't be automatically stringified)
          value: `Non-Error promise rejection captured with value: ${String(reason)}`,
        },
      ],
    },
  };
}

function getStackParser(): StackParser {
  const client = getClient<ServerRuntimeClient>();

  if (!client) {
    return () => [];
  }

  return client.getOptions().stackParser;
}
